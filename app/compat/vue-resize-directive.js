// Minimal shim for vue-resize-directive in Vue 3
export default {
    mounted (el, binding) {
        const handler = binding.value;
        const ro = new ResizeObserver(() => handler());
        ro.observe(el);
        el.__v_resize_observer__ = ro;
    },
    beforeUnmount (el) {
        el.__v_resize_observer__ && el.__v_resize_observer__.disconnect();
        delete el.__v_resize_observer__;
    },
};
