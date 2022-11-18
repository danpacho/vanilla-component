import { Component } from "./component"
import { track } from "./core"

/**
 * Reactive component class wrapper function
 * @param htmlSetter `html` template function
 */
const $component = (htmlSetter: () => string) => {
    const $target = new Component({
        template: htmlSetter,
    })

    track(() => {
        $target.updateDOM()
    })
    return $target
}

export { $component }
