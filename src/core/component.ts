import { EventListener } from "./event.listener"
import { HTMLSetter, type TrackFunction, track } from "."

const DEFAULT = {
    RENDER_TARGET_ID: "app",
}

const createFragment = (template: HTMLSetter, id: string) => {
    const fragment = document.createElement("div")
    fragment.id = id
    fragment.innerHTML = template()
    fragment.style.display = "contents" // For practical fragment role, display: "contents" makes it acting like non-exisisting element.
    return {
        fragment,
    }
}

type Fragment = HTMLDivElement

class Component extends EventListener {
    #renderTargetID = DEFAULT.RENDER_TARGET_ID
    #fragment: Fragment
    #ref: Fragment

    id: string
    template: HTMLSetter

    constructor({
        template,
        renderTargetID,
    }: {
        template: HTMLSetter
        renderTargetID?: string | undefined
    }) {
        const id = window.crypto.randomUUID()
        const { fragment } = createFragment(template, id)

        super(fragment)

        this.#fragment = fragment
        this.#ref = this.#fragment

        this.id = id
        this.template = template

        if (renderTargetID) this.#renderTargetID = renderTargetID
    }

    /**
     * Update `ref` element
     */
    #updateRef() {
        this.#ref = this.#fragment
    }

    /**
     * Mount fragment DOM element at `this.#renderTargetID`
     */
    #mount(renderTargetID?: string) {
        this.#renderTargetID = renderTargetID ?? DEFAULT.RENDER_TARGET_ID
        const target = document.getElementById(this.#renderTargetID)
        target?.appendChild(this.#fragment)

        this.mountEvent()
    }

    /**
     * Update `HTML` template in fragment
     */
    updateHTML() {
        this.#fragment.innerHTML = this.template()
        this.#updateRef()
    }
    /**
     * Use fragment element when mounted
     * @param mountedCallback get mounted fragment as first argument
     * @example
     * .onMounted((fragment) => {
     *  // use fragment DOM in callback
     * })
     */
    onMounted(
        mountedCallback: ({ target }: { target: Fragment }) => void,
        renderTargetID?: string
    ) {
        this.#mount(renderTargetID)
        mountedCallback({ target: this.#fragment })
        return this
    }

    /**
     * Render statefull component
     * @param renderTargetID if renderTargetID is provided, component will be mounted there
     */
    render(renderTargetID?: string) {
        this.#mount(renderTargetID)
        return this
    }

    /**
     * Effect is track siginal variables.
     * Whenever signal changes, effectFunction will be executed.
     */
    effect(effectFuntion: TrackFunction) {
        this.render()
        track(effectFuntion)
        return this
    }

    /**
     * Get bulk DOM reference. Same as current fragment, but it is not mounted in DOM tree.
     */
    ref() {
        return this.#ref
    }

    /**
     * Get static `HTML` component. Use it for static components.
     */
    html(renderTargetID?: string) {
        this.#mount(renderTargetID)
    }
}

export { Component }
