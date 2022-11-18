// ------------------------ track ------------------------
type TrackFunction = () => void | unknown
type Dependencies = Set<number>

type ExecutionContext = {
    action: TrackFunction
    deps: Dependencies
}
/**
 * Temporary box containing the running context
 */
const globalExecutionContext: ExecutionContext[] = []
/**
 * Track the signal and execute the `trackFunction` the moment when detecting the change.
 * @param trackFunction Run at the point when the tracked signal changes
 */
const track = (trackFunction: TrackFunction) => {
    globalExecutionContext.push({
        action: trackFunction,
        deps: new Set(),
    })

    try {
        trackFunction() // initail setting: signal's connected channels
    } finally {
        globalExecutionContext.pop() // remove execution context
    }
}

// ------------------------ signal ------------------------
type SignalContainer = {
    [id: number]: unknown
}
const initialSignalContainer: SignalContainer = {}
const previousSignalContainer: SignalContainer = {}

const isDepsShouldUpdate = (
    currentGlobalDeps: Dependencies,
    currentConnecteChannelsDeps: Dependencies
) =>
    currentGlobalDeps.size !== currentConnecteChannelsDeps.size ||
    [...currentGlobalDeps].every((value) =>
        currentConnecteChannelsDeps.has(value)
    ) === false

/**
 * Update connected channel each time `SignalGetter` is called
 */
const updateConnectedChannels = ({
    signalId,
    connectedChannels,
    globalExecutionContext,
}: {
    signalId: number
    globalExecutionContext: ExecutionContext[]
    connectedChannels: ExecutionContext[]
}) => {
    const currentEC = globalExecutionContext.at(-1)
    if (currentEC) {
        currentEC.deps.add(signalId)
        globalExecutionContext.push(currentEC)

        if (connectedChannels.length >= 1) {
            if (
                isDepsShouldUpdate(
                    currentEC.deps,
                    connectedChannels.at(-1)?.deps as Dependencies
                )
            ) {
                connectedChannels.push(currentEC)
            }
        } else {
            connectedChannels.push(currentEC)
        }

        globalExecutionContext.pop()
    }
}

export type SignalGetter<T> = () => T
export type SignalSetterFunction<T> = T | ((prev: T) => T)
export type SignalSetter<T> = (setterFunction: SignalSetterFunction<T>) => void
export type SignalResetter = () => void
type SignalAction<T> = [
    SignalGetter<T>,
    SignalSetter<T>,
    SignalResetter,
    SignalGetter<T>
]

let globalSignalCount = 0
/**
 * Signal that contains trackable data
 * @param initialData initail data type
 * @returns `[Getter, Setter, Resetter, PrevGetter]`
 */
const signal = <T>(initialData: T): SignalAction<T> => {
    const connectedChannels: ExecutionContext[] = []

    const signalId = globalSignalCount++
    const state = {
        [signalId]: initialData,
    }
    initialSignalContainer[signalId] = initialData

    const getState: SignalGetter<T> = () => {
        updateConnectedChannels({
            signalId,
            globalExecutionContext,
            connectedChannels,
        })
        return state[signalId] as T
    }

    const setState: SignalSetter<T> = (setter) => {
        let nextState: T
        if (setter instanceof Function) {
            nextState = setter(state[signalId] as T)
        } else {
            nextState = setter
        }

        const shouldUpdate = nextState !== state[signalId]
        if (shouldUpdate) {
            previousSignalContainer[signalId] = state[signalId]
            state[signalId] = nextState

            connectedChannels.forEach((channel) => {
                channel.action()
            })
        }
    }

    const resetState: SignalResetter = () => {
        setState(initialSignalContainer[signalId] as T)
    }

    const getPreviousState: SignalGetter<T> = () =>
        (previousSignalContainer[signalId] as T) ??
        (initialSignalContainer[signalId] as T)

    return [getState, setState, resetState, getPreviousState]
}

export type HTMLSetter = () => string

export { signal, track }
