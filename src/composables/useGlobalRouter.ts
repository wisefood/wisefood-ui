import { useRouter } from "vue-router";

export const useGlobalRouter = () => {
  const router = useRouter();

  const scrollWithOffset = (offset = 30) => {
    // Scroll to top then adjust by offset up
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      window.scrollBy(0, -offset);
    }, 300); // delay to ensure smooth scroll completes, adjust if needed
  };

  const navigateTo = async (path: string) => {
    await router.push(path);
    scrollWithOffset();
  };

  const refreshPage = async () => {
    await router.go(0);
    scrollWithOffset();
  };

  const goBack = async () => {
    router.go(-1);
    // Can't await go(), so optional: add a delay before scroll
    setTimeout(() => {
      scrollWithOffset();
    }, 300);
  };

  const replace = async (path: string) => {
    await router.replace(path);
    scrollWithOffset();
  };

  return {
    router,
    navigateTo,
    refreshPage,
    goBack,
    replace,
  };
};
