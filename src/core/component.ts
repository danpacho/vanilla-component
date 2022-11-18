import type { HTMLSetter } from "./core"

type Target = HTMLDivElement
type EventName = keyof HTMLElementEventMap
export type EventType = HTMLElementEventMap

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerEventType = any
type EventInfo = {
    type: EventName
    handler: (e: HandlerEventType) => void | unknown
    name?: string | undefined
    targetType?: "window" | "self" | undefined
    targetId?: string | undefined
}

type EventHandler = ({ target }: { target: Target }) => EventInfo
export type EventHandlerFunction = (
    e: HandlerEventType,
    target?: Target
) => void | unknown

type Fragment = HTMLDivElement
/**
 * Get default `fragment` element. It's like react `fragment`.
 * @note  For practical fragment role, `display: "contents"` makes it acting like non-exisisting element.
 * @param template HTML setter function
 * @param id fragment unique ID
 */
const createFragment = (
    template: HTMLSetter,
    id: string
): { fragment: Fragment } => {
    const fragment: Fragment = document.createElement("div")
    fragment.id = id
    fragment.innerHTML = template()
    fragment.style.display = "contents"
    return {
        fragment,
    }
}

const DEFAULT_RENDER_TARGET_ID = "app"

class Component {
    #eventInfoList: EventInfo[] = []
    #renderTargetID = DEFAULT_RENDER_TARGET_ID
    #fragment: Fragment
    #ref: Fragment

    template: HTMLSetter
    id: string

    constructor({ template }: { template: HTMLSetter }) {
        const id = window.crypto.randomUUID()
        const { fragment } = createFragment(template, id)

        this.#fragment = fragment
        this.#ref = this.#fragment

        this.id = id
        this.template = template
    }

    #updateRenderTargetID(newID: string) {
        this.#renderTargetID = newID
    }

    /**
     * Update `ref` element
     */
    #updateRef() {
        this.#ref = this.#fragment
    }

    /**
     * Mount `fragment` `DOM` element at `this.#renderTargetID`
     */
    #mount(renderTargetID?: string) {
        if (renderTargetID) {
            this.#updateRenderTargetID(renderTargetID)
        }
        const target = document.getElementById(this.#renderTargetID)
        target?.appendChild(this.#fragment)

        this.mountEvent()
    }

    /**
     * Update `HTML` template in fragment
     * @note core functionality of updating `DOM`.
     */
    updateDOM() {
        this.#fragment.innerHTML = this.template()
        this.#updateRef()
    }

    /**
     * Use fragment element, when mounted to the `DOM` tree.
     * @note should be called after `render` or `staticRender`
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
     * Get `fragment` reference.
     * @note Same as current fragment, but it is not mounted in `DOM` tree.
     */
    ref() {
        return this.#ref
    }

    #updateEventHandler(
        updateIndex: number,
        updatedHandler: EventInfo["handler"]
    ) {
        const updatedEventInfo: EventInfo = {
            ...(this.#eventInfoList[updateIndex] as EventInfo),
            handler: updatedHandler,
        }
        this.#eventInfoList.splice(updateIndex, 1, updatedEventInfo)
    }

    /**
     * Add eventlistner
     * @param eventHandler returns `evntInfo` that is stored in specific component
     */
    addEvent(eventHandler: EventHandler) {
        const eventInfo = eventHandler({ target: this.#fragment })
        const { handler, type, name } = eventInfo

        this.#eventInfoList.push({
            name,
            type,
            handler,
            targetType: eventInfo.targetType,
            targetId: eventInfo.targetId,
        })

        return this
    }

    /**
     * Mount event at the `fragment`
     * @note sync event with component rendering cycles.
     */
    mountEvent() {
        this.#eventInfoList.forEach((eventInfo, index) => {
            const { type } = eventInfo
            if (eventInfo.targetType === "window") {
                const handler = (e: HandlerEventType) => {
                    eventInfo.handler(e)
                }
                this.#updateEventHandler(index, handler)

                window.addEventListener(type, handler)
                return this
            } else {
                const handler = (e: HandlerEventType) => {
                    if (eventInfo?.targetId) {
                        if (
                            (e.target as HTMLElement).id === eventInfo.targetId
                        ) {
                            eventInfo.handler(e)
                        }
                    } else {
                        eventInfo.handler(e)
                    }
                }
                this.#updateEventHandler(index, handler)

                this.#fragment.addEventListener(type, handler)
                return this
            }
        })
    }

    /**
     * Remove specific eventw
     * @param targetName remove event target name
     */
    removeEvent(targetName: string) {
        const removedEventInfoList = this.#eventInfoList.filter(
            (e) => e.name !== targetName
        )
        this.#eventInfoList = removedEventInfoList
        return this
    }
}

export { Component }
