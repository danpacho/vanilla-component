const map = <T>(data: T[], render: (data: T) => string) =>
    data.map(render).reduce((string, curr) => `${string}${curr}`, "")

export { map }
