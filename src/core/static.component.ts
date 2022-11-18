import { Component } from "./component"
import { HTMLSetter } from "./core"

/**
 * Static component class wrapper function
 * @param htmlSetter `html` template function
 */
const component = (htmlSetter: HTMLSetter) => {
    const $target = new Component({
        template: htmlSetter,
    })

    return $target
}

export { component }
