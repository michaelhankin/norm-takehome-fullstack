This repository contains a client and server codebase. 

## Server Repository:

Build the Docker image with:
```sh
docker build -t norm-fullstack .
```

Set your OpenAI API Key (I use [direnv](https://direnv.net/) for this):
```sh
export OPENAI_API_KEY=...
```

Run the server with:
```sh
docker run -p 8000:80 --rm -e OPENAI_API_KEY norm-fullstack
```

Then, you can access Swagger at http://127.0.0.1:8000/docs, and call the `/ask` endpoint.

### Implementation Details

- Used a [structured LLM](https://docs.llamaindex.ai/en/stable/understanding/extraction/structured_llms/) to extract the laws from the source PDF
    - This bit definitely took the longest to get right - I tried using different combinations of LlamaIndex document / node parsers prior to this, as well as parsing the PDF directly with pypdf, and the results weren't very good
    - The structured LLM worked very well without much adjustment
- Used the provided Qdrant vector store + a LlamaIndex CitationQueryEngine + another structured LLM to answer questions over the corpus of laws
    - This structured LLM was taught to format answers according to our `Output` model
- The FastAPI bit is pretty straightforward, but I'll note that I switched the project to [uv](https://docs.astral.sh/uv/) for the better UX / speed

## Client Repository 

In the `frontend` folder you'll find a light NextJS app with it's own README including instructions to run. Your task here is to build a minimal client experience that utilizes the service build in part 1.

### Implementation Details

- Wanted to build a similar UI to Claude
- The citations are included in the footer of each message from the model, but I instructed the model not to include them inline, since I think that makes the message less readable