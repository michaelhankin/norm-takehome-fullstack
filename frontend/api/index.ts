export interface QueryCitation {
    number: string
    text: string
}

interface QueryOutput {
    query: string
    response: string
    citations: QueryCitation[]
}

export async function askQuery(query: string) {
    const params = new URLSearchParams({
        query
    })
    const response = await fetch(`/api/ask?${params.toString()}`)
    if (!response.ok) {
        throw Error(`Unexpected response: ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as QueryOutput
    return data
}