This page separates three things that are usually bundled together: search that works now, a retrieval-ready corpus, and a vector or RAG service that does not exist here.

## What is implemented

**Lexical search.** The search page loads `data/search-index.json` and ranks results in your browser. It tokenises page text, scores title matches above body matches, and returns highlighted snippets. It runs offline from static files, needs no key and sends no query anywhere. If the index cannot load, the page says so and lists its links instead of pretending to have results.

**A chunk corpus.** Every page is split at headings into chunks with stable IDs, character counts, estimated token counts and links to the HTML and Markdown versions. See `data/chunks/manifest.json` and the per-page files beside it.

**A typed graph.** Relationships are explicit and typed in `data/graph.json`, with each edge naming a source and a target node. Supported edge types are listed in the file itself.

**Machine-readable indexes.** `data/catalog.json`, `data/trees/<resource>.json`, `data/manifest.json` and [llms.txt](file:/llms.txt).

These are retrieval-ready materials. They are not a search service.

## What is not implemented

- No vector database, embedding model or similarity index.
- No server-side retrieval, no query API beyond static files.
- No generative answers. Nothing here reads your question and writes a response.
- No automatic ingestion of new upstream content.

A static site cannot host a vector index or call a model by itself. Saying otherwise would be a marketing claim rather than a description of the files in this repository.

## Why the corpus is shaped this way

A vector index is useful when the questions are fuzzy and the corpus is large and unknown. This library is small, stable and well structured: fourteen resources, named routes and a typed graph. A careful agent with `llms.txt`, a route and two chunks gets better precision than an approximate nearest-neighbour lookup, and every answer keeps a source ID. Lexical search is also inspectable: when a result is wrong, you can see the term that matched.

## If a vector layer is added later

That work belongs in a separate deployment, not in these static files. A realistic design:

1. **Extraction.** A scheduled job reads the published chunk files from this repository at a tagged version. It does not read private material.
2. **Embedding.** An embedding model converts each chunk to a vector. The model, its dimensions and its version are recorded alongside the index.
3. **Storage.** Cloudflare Vectorize, or any comparable vector store, holds vectors keyed by `source_id`, with metadata for page, type and version.
4. **Query.** A Worker accepts a query, embeds it, retrieves the top candidates and returns chunk IDs and links. It does not generate prose unless a separate model step is added and paid for.
5. **Citation.** Results keep their `source_id`, so an agent can fetch the original chunk and page.

Costs and permissions to settle first: an embeddings provider and its key, a Vectorize index and its pricing, a Worker deployment, and a rule for what happens when a chunk is deleted upstream. None of that is configured here. No key, endpoint or index ID appears in this site, and none should ever be placed in frontend JavaScript.

## Honest status line

Search: implemented and tested in a browser. Chunk index: generated from the same source as the pages. Vector search: not implemented. RAG answers: not implemented. The manifest records this in `retrieval.implemented` and `retrieval.not_implemented`.
