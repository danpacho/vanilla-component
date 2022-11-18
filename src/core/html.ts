/**
 * Support syntax highlighting, returns `string`.
 * @note Use it with `lit-html` vscode plugin for syntax highlighting.
 */
const html = (
    templateStrings: TemplateStringsArray,
    ...variables: Array<string | number | undefined>
): string => {
    const toStringVariables = variables.map((v) =>
        v ? (typeof v === "string" ? v : String(v)) : ""
    )
    return toStringVariables.reduce((finalString, variable, index) => {
        return `${finalString}${variable}${templateStrings[index + 1]}`
    }, templateStrings[0] ?? "")
}

export { html }
