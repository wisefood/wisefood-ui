"""Run a recording in a network namespace of its own.

Chrome drops every open connection when the host's network interfaces change
(net::ERR_NETWORK_CHANGED). On a server where tests start and stop Docker
containers every few seconds, a FoodChat plan, which streams for a minute or
two, almost never survives. Inside an empty network namespace Chrome only
sees loopback, which never changes; it reaches the internet through an HTTP
proxy on that loopback, which hands each connection over a Unix socket (a
file, so it crosses namespaces) to a proxy in the host's namespace.

    python isolated.py clips.py foodchat-generate-plan en

Needs unprivileged user namespaces (`unshare --user --net`), nothing else.
lib.py points Chrome at the proxy when HELP_CLIPS_PROXY is set.
"""
import asyncio, os, subprocess, sys, tempfile

PORT = 3128


async def pipe(reader, writer):
    try:
        while data := await reader.read(65536):
            writer.write(data)
            await writer.drain()
    except (ConnectionError, asyncio.CancelledError):
        pass
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def outer(sock_path):
    """Host side: a minimal HTTP CONNECT proxy listening on a Unix socket."""
    async def handle(cr, cw):
        try:
            head = await cr.readuntil(b'\r\n\r\n')
        except Exception:
            cw.close()
            return
        method, target = head.split(b' ', 2)[:2]
        if method != b'CONNECT':   # the demo is HTTPS only; plain HTTP is not proxied
            cw.write(b'HTTP/1.1 405 Method Not Allowed\r\n\r\n')
            cw.close()
            return
        host, _, port = target.decode().rpartition(':')
        try:
            ur, uw = await asyncio.open_connection(host, int(port))
        except Exception:
            cw.write(b'HTTP/1.1 502 Bad Gateway\r\n\r\n')
            cw.close()
            return
        cw.write(b'HTTP/1.1 200 Connection Established\r\n\r\n')
        await asyncio.gather(pipe(cr, uw), pipe(ur, cw))
    server = await asyncio.start_unix_server(handle, path=sock_path)
    async with server:
        await server.serve_forever()


async def inner(sock_path):
    """Namespace side: loopback TCP to the Unix socket."""
    async def handle(cr, cw):
        ur, uw = await asyncio.open_unix_connection(sock_path)
        await asyncio.gather(pipe(cr, uw), pipe(ur, cw))
    server = await asyncio.start_server(handle, '127.0.0.1', PORT)
    async with server:
        await server.serve_forever()


def main():
    if sys.argv[1:2] == ['--inner']:   # inside the namespace
        sock_path, cmd = sys.argv[2], sys.argv[3:]
        subprocess.run(['ip', 'link', 'set', 'lo', 'up'], check=True)
        fwd = subprocess.Popen([sys.executable, __file__, '--forward', sock_path])
        try:
            env = dict(os.environ, HELP_CLIPS_PROXY=f'http://127.0.0.1:{PORT}')
            sys.exit(subprocess.run(cmd, env=env).returncode)
        finally:
            fwd.terminate()
    if sys.argv[1:2] == ['--forward']:
        asyncio.run(inner(sys.argv[2]))
        return
    if sys.argv[1:2] == ['--outer']:
        asyncio.run(outer(sys.argv[2]))
        return
    # Host side: start the proxy, then run the command in a fresh namespace.
    sock_path = os.path.join(tempfile.mkdtemp(prefix='help-clips-'), 'proxy.sock')
    proxy = subprocess.Popen([sys.executable, __file__, '--outer', sock_path])
    import time
    for _ in range(50):   # the namespace's first connection needs the socket
        if os.path.exists(sock_path):
            break
        time.sleep(0.1)
    try:
        cmd = sys.argv[1:]
        if cmd and cmd[0].endswith('.py'):
            cmd = [sys.executable] + cmd
        rc = subprocess.run(['unshare', '--user', '--map-root-user', '--net',
                             sys.executable, __file__, '--inner', sock_path] + cmd).returncode
        sys.exit(rc)
    finally:
        proxy.terminate()


if __name__ == '__main__':
    main()
