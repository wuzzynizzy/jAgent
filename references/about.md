jAgent is a public working library. It collects fourteen skills, workflows and interface resources that are useful when directing an agent through design, writing, engineering, research or inspection work. Each resource page explains what the thing does, how to run it, when it helps and where it stops being the right tool.

## Who it is for

People who already use coding agents and want a reviewed starting point instead of a list of repository links. It assumes you can install a CLI, read a source file and judge whether advice fits your project.

## What was reviewed

Fourteen repositories, each pinned to one commit and inspected by reading source rather than landing pages. Every page records the commit, the licence, the paths that were read and the paths that exist upstream. The review is selective: large repositories were sampled, test suites were not run for every project, and no skill was installed for you.

[Provenance](page:provenance) lists exactly what was checked and where the gaps are.

## What is not here

There is no account system, no hosted service and no server. The site is static files. Search runs in your browser over a JSON index. There is no vector database, no embedding service and no model answering questions; [retrieval and RAG status](page:retrieval-and-rag) explains why and what a future integration would take.

Nothing here is a promise that an agent will remember the library. A new chat starts empty. Agents have to be pointed at [llms.txt](file:/llms.txt) or the [context protocol](page:context-protocol), and only then will they load anything.

## Private material stays private

The library records public upstream repositories only. It carries no private notes, project handoffs, credentials, browser state or links into a private drive. The working files behind the review are kept outside this site.

## Reuse

The guides, page text and build code are published for reuse. Code is MIT licensed. Written content is CC BY 4.0. Each resource keeps its own upstream licence, and the recorded source trees point at the upstream repositories rather than copying their contents, so nothing here relicenses someone else's work.

If you quote a page, cite the page URL and the library version shown in the footer. Data files carry the same version in `data/manifest.json`.
