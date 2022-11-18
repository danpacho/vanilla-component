import { $component, html, signal } from "../core"
import style from "./index.module.css"

const Test = () => {
    const [count, setCount] = signal(0)

    const plus = () => {
        setCount((c) => c + 1)
    }
    const minus = () => {
        setCount((c) => c - 1)
    }

    return $component(
        () =>
            html`
                <div class="${style.box}">
                    <button id="minus" class="${style.minus} ${style.btn}">
                        minus
                    </button>
                    <h1>${String(count())}</h1>
                    <button
                        draggable="true"
                        id="plus"
                        class="${style.plus} ${style.btn}"
                    >
                        plus
                    </button>
                </div>
                <h1>${String(count() % 2 === 0)}</h1>
            `
    )
        .addEvent(() => ({
            handler: plus,
            targetId: "plus",
            type: "click",
            name: "plus",
        }))
        .addEvent(() => ({
            handler: minus,
            targetId: "minus",
            type: "click",
        }))
        .addEvent(() => ({
            handler: () => {
                console.log("remove it")
            },
            targetId: "minus",
            type: "click",
            name: "remove",
        }))
        .removeEvent("remove")
}

Test().render("app")
