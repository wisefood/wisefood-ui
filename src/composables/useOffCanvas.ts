// composables/useOffCanvas.ts
import { reactive, markRaw, nextTick, type Component } from "vue";

// Types
export interface OffCanvasOptions {
  title?: string;
  component?: Component | null;
  componentProps?: Record<string, any>;
  location?: "left" | "right";
  width?: string | number;
  onClose?: () => void;
  forceRefresh?: boolean; // NEW: Optional flag to force component refresh
}

export interface OffCanvasInstance {
  id: string;
  isOpen: boolean;
  title: string;
  component: Component | null;
  componentProps: Record<string, any>;
  location: "left" | "right";
  width: string | number;
  onClose: () => void;
  refreshKey: number; // NEW: Internal refresh key for component recreation
}

// Global reactive state
const offCanvasState = reactive({
  instances: new Map<string, OffCanvasInstance>(),
  activeInstances: [] as OffCanvasInstance[],
});

export function useOffCanvas() {
  // Create a new off-canvas instance
  const create = (
    id: string,
    options: OffCanvasOptions = {}
  ): OffCanvasInstance => {
    const instance: OffCanvasInstance = {
      id,
      isOpen: false,
      title: options.title || "Off Canvas",
      component: options.component ? markRaw(options.component) : null,
      componentProps: options.componentProps || {},
      location: options.location || "right",
      width: options.width || 400,
      onClose: options.onClose || (() => {}),
      refreshKey: 0, // NEW: Initialize refresh key
    };

    offCanvasState.instances.set(id, instance);
    return instance;
  };

  // Open an off-canvas
  const open = (
    id: string,
    options: OffCanvasOptions = {}
  ): OffCanvasInstance => {
    let instance = offCanvasState.instances.get(id);

    if (!instance) {
      instance = create(id, options);
    } else {
      // Update existing instance
      if (options.title !== undefined) instance.title = options.title;
      if (options.component !== undefined) {
        instance.component = options.component
          ? markRaw(options.component)
          : null;
      }
      if (options.componentProps !== undefined) {
        instance.componentProps = options.componentProps;
      }
      if (options.location !== undefined) instance.location = options.location;
      if (options.width !== undefined) instance.width = options.width;
      if (options.onClose !== undefined) instance.onClose = options.onClose;

      // NEW: Handle refresh - increment refreshKey if forceRefresh is true or if reopening
      if (options.forceRefresh === true || !instance.isOpen) {
        instance.refreshKey++;
      }
    }

    // Add to active instances if not already there
    if (!offCanvasState.activeInstances.find((active) => active.id === id)) {
      offCanvasState.activeInstances.push(instance);
    }

    instance.isOpen = true; // Reset open state before opening

    return instance;
  };

  // Close an off-canvas with smooth transition
  const close = (id: string): void => {
    const instance = offCanvasState.instances.get(id);
    if (instance) {
      instance.isOpen = false;
      // Don't remove from activeInstances immediately - let transition complete first
      // The component will handle the cleanup after transition via handleModelChange
    }
  };

  // NEW: Force refresh a component without closing/opening
  const refresh = (id: string): void => {
    const instance = offCanvasState.instances.get(id);
    if (instance) {
      instance.refreshKey++;
    }
  };

  // Internal method to fully remove an instance after transition
  const removeFromActive = (id: string): void => {
    const instance = offCanvasState.instances.get(id);
    if (instance) {
      instance.onClose();

      // Remove from active instances
      const index = offCanvasState.activeInstances.findIndex(
        (active) => active.id === id
      );
      if (index > -1) {
        offCanvasState.activeInstances.splice(index, 1);
      }
    }
  };

  // Close all off-canvas instances
  const closeAll = (): void => {
    offCanvasState.activeInstances.forEach((instance) => {
      instance.isOpen = false;
    });
    // Let the transitions finish, then cleanup will happen via handleDrawerChange
  };

  // Get an instance
  const getInstance = (id: string): OffCanvasInstance | undefined => {
    return offCanvasState.instances.get(id);
  };

  // Get all active instances
  const getActiveInstances = (): OffCanvasInstance[] => {
    return offCanvasState.activeInstances;
  };

  // Check if an instance is open
  const isOpen = (id: string): boolean => {
    const instance = offCanvasState.instances.get(id);
    return instance?.isOpen || false;
  };

  // Update instance options
  const updateInstance = (
    id: string,
    options: Partial<OffCanvasOptions>
  ): void => {
    const instance = offCanvasState.instances.get(id);
    if (instance) {
      if (options.title !== undefined) instance.title = options.title;
      if (options.component !== undefined) {
        instance.component = options.component
          ? markRaw(options.component)
          : null;
      }
      if (options.componentProps !== undefined) {
        instance.componentProps = options.componentProps;
      }
      if (options.location !== undefined) instance.location = options.location;
      if (options.width !== undefined) instance.width = options.width;
      if (options.onClose !== undefined) instance.onClose = options.onClose;

      // NEW: Handle refresh if specified
      if (options.forceRefresh === true) {
        instance.refreshKey++;
      }
    }
  };

  // Remove an instance completely
  const remove = (id: string): void => {
    close(id);
    offCanvasState.instances.delete(id);
  };

  return {
    create,
    open,
    close,
    closeAll,
    getInstance,
    getActiveInstances,
    isOpen,
    updateInstance,
    remove,
    refresh, // NEW: Expose refresh method
    removeFromActive, // Expose for component use
    // Expose reactive state for advanced usage
    instances: offCanvasState.instances,
    activeInstances: offCanvasState.activeInstances,
  };
}
