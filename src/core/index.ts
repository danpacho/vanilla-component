import { Component } from "./component"

// ------------------------ track ------------------------
export type TrackFunction = () => void | unknown
type Dependencies = Set<number>

type ExecutionContext = {
    action: TrackFunction
    deps: Dependencies
}
const globalExecutionContext: ExecutionContext[] = []
const track = (fn: TrackFunction) => {
    globalExecutionContext.push({
        action: fn,
        deps: new Set(),
    })
    fn()
}

// ------------------------ signal ------------------------
type SignalContainer = {
    [id: number]: unknown
}
const originSignal: SignalContainer = {}
const prevSignal: SignalContainer = {}

const isDepsShouldUpdate = (setA: Dependencies, setB: Dependencies) =>
    setA.size !== setB.size ||
    [...setA].every((value) => setB.has(value)) === false

const updateChannels = ({
    signalId,
    connectedChannels,
    latestGlobalExecutionContext,
}: {
    signalId: number
    latestGlobalExecutionContext: ExecutionContext
    connectedChannels: ExecutionContext[]
}) => {
    latestGlobalExecutionContext.deps.add(signalId)
    if (connectedChannels.length >= 1) {
        if (
            isDepsShouldUpdate(
                latestGlobalExecutionContext.deps,
                connectedChannels.at(-1)?.deps as Dependencies
            )
        ) {
            connectedChannels.push(latestGlobalExecutionContext)
        }
        globalExecutionContext.pop()
    } else {
        connectedChannels.push(latestGlobalExecutionContext)
    }
}

type Getter<T> = () => T
type SetterFunction<T> = T | ((prev: T) => T)
type Setter<T> = (setterFunction: SetterFunction<T>) => void
type Resetter = () => void
type PrevGetter<T> = () => T

let globalId = 0
const signal = <T>(
    data: T
): [Getter<T>, Setter<T>, Resetter, PrevGetter<T>] => {
    const connectedChannels: ExecutionContext[] = []

    const signalId = globalId++
    const state = {
        [signalId]: data,
    }
    originSignal[signalId] = data

    const getState: Getter<T> = () => {
        const latestGlobalExecutionContext = globalExecutionContext.at(-1)

        if (latestGlobalExecutionContext) {
            updateChannels({
                signalId,
                latestGlobalExecutionContext,
                connectedChannels,
            })
        }
        return state[signalId] as T
    }

    const setState: Setter<T> = (setter) => {
        prevSignal[signalId] = state[signalId]

        if (setter instanceof Function) {
            state[signalId] = setter(state[signalId] as T)
        } else {
            state[signalId] = setter
        }

        connectedChannels.forEach((channel) => {
            channel.action()
        })
    }

    const resetState: Resetter = () => {
        setState(originSignal[signalId] as T)
    }

    const getPreviousState: PrevGetter<T> = () =>
        (prevSignal[signalId] as T) ?? (originSignal[signalId] as T)

    return [getState, setState, resetState, getPreviousState]
}

// ------------------------ component ------------------------
export type HTMLSetter = () => string

/**
 * Support syntax highlighting, return string
 * Use it with `lit-html` vscode plugin
 */
const html = (
    templateStrings: TemplateStringsArray,
    ...variables: Array<string | number>
): string => {
    const toStringVariables = variables.map((v) =>
        typeof v === "string" ? v : String(v)
    )
    return toStringVariables.reduce((finalString, variable, index) => {
        return `${finalString}${variable}${templateStrings[index + 1]}`
    }, templateStrings[0] ?? "")
}

/**
 * Component class wrapper function
 * @param htmlSetter `html` template function
 * @param option `renderTargetID` and `isStatic` option included
 */
const component = (
    htmlSetter: HTMLSetter,
    option?: { renderTargetID?: string; isStatic?: boolean }
) => {
    const $target = new Component({
        template: htmlSetter,
        renderTargetID: option?.renderTargetID,
    })

    if (option?.isStatic) return $target

    track(() => {
        $target.updateHTML()
    })
    return $target
}

export { signal, component, html, track }
