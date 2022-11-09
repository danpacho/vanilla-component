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

class EventListener {
    #target: Target
    #eventInfoList: EventInfo[] = []

    constructor(target: Target) {
        this.#target = target
    }

    updateTarget(target: Target) {
        this.#target = target
    }

    /**
     * Add eventlistner
     * @param eventHandler returns evntInfo
     */
    addEvent(eventHandler: ({ target }: { target: Target }) => EventInfo) {
        const eventInfo = eventHandler({ target: this.#target })
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

    mountEvent() {
        this.#eventInfoList.forEach((eventInfo, index) => {
            const { type } = eventInfo
            let eventHandler
            if (eventInfo.targetType === "window") {
                eventHandler = function (e: HandlerEventType) {
                    eventInfo.handler(e)
                }
                const updated: EventInfo = {
                    ...eventInfo,
                    handler: eventHandler,
                }
                window.addEventListener(type, eventHandler)
                this.#eventInfoList.splice(index, 1, updated)
                return this
            } else {
                eventHandler = function (e: HandlerEventType) {
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
                const updated: EventInfo = {
                    ...eventInfo,
                    handler: eventHandler,
                }

                this.#target.addEventListener(type, updated.handler, {
                    capture: true,
                })
                this.#eventInfoList.splice(index, 1, updated)
                return this
            }
        })
    }

    removeEvent(targetName: string) {
        const targetEvent = this.#eventInfoList.find(
            (ev) => ev.name === targetName
        )
        if (targetEvent === undefined) {
            throw Error(
                `Error: Event ${targetName} is not exsists\nPlease Check event name again`
            )
        }
        const { type } = targetEvent
        if (targetEvent.targetType === "window") {
            window.removeEventListener(type, targetEvent.handler)
        } else {
            this.#target.removeEventListener(type, targetEvent.handler, {
                capture: true,
            })
        }
        return this
    }
}

export { EventListener }
