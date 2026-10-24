/* jAgent interface behaviour.
   Progressive enhancement only: every page reads and navigates without this file. */

(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] === undefined || attrs[key] === null) return;
        if (key === "text") node.textContent = attrs[key];
        else if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  /* Copy buttons on code blocks */

  document.querySelectorAll(".prose pre").forEach(function (pre) {
    var wrap = el("div", { className: "code-block" });
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var button = el("button", {
      type: "button",
      className: "code-copy",
      "aria-label": "Copy this code block"
    }, [document.createTextNode("Copy")]);
    button.addEventListener("click", function () {
      var code = pre.querySelector("code");
      var text = (code || pre).innerText;
      var done = function (ok) {
        button.textContent = ok ? "Copied" : "Copy failed";
        window.setTimeout(function () { button.textContent = "Copy"; }, 2000);
      };
      var fallback = function () {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
        document.body.removeChild(area);
        done(ok);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
    wrap.appendChild(button);
  });

  /* Category filters on the resource index */

  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var buttons = Array.prototype.slice.call(group.querySelectorAll("[data-filter]"));
    var list = group.querySelector("[data-resource-list]");
    var status = group.querySelector("[data-filter-status]");
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll("[data-category]"));
    function apply(value) {
      var shown = 0;
      items.forEach(function (item) {
        var match = value === "all" || item.dataset.category === value;
        item.hidden = !match;
        if (match) shown += 1;
      });
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.filter === value ? "true" : "false");
      });
      if (status) {
        status.textContent = shown + " of " + items.length + " resources shown" +
          (value === "all" ? "" : " in " + value);
      }
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () { apply(button.dataset.filter); });
    });
    apply("all");
  });

  /* Lexical search */

  var searchForm = document.getElementById("search-form");
  if (searchForm) {
    var input = document.getElementById("q");
    var results = document.getElementById("search-results");
    var status = document.getElementById("search-status");
    var index = null;
    var loading = false;
    var failed = false;
    var active = -1;

    var STOP = ("a an and are as at be by for from has have how if in into is it its of on or that the their " +
      "then there these this to was were what when where which who why will with you your").split(" ");

    function tokenize(text) {
      return text.toLowerCase().replace(/[^a-z0-9+#./-]+/g, " ").split(/\s+/).filter(function (word) {
        if (!word || word.length < 2 || STOP.indexOf(word) !== -1) return false;
        return true;
      });
    }

    function stem(word) {
      if (word.length > 4 && /ies$/.test(word)) return word.slice(0, -3) + "y";
      if (word.length > 4 && /es$/.test(word)) return word.slice(0, -2);
      if (word.length > 3 && /s$/.test(word) && !/ss$/.test(word)) return word.slice(0, -1);
      return word;
    }

    function prepare(data) {
      var df = Object.create(null);
      var docs = data.chunks.map(function (chunk) {
        var counts = Object.create(null);
        var titleCounts = Object.create(null);
        var terms = tokenize(chunk.text + " " + chunk.page_title).map(stem);
        var titleTerms = tokenize(chunk.page_title + " " + chunk.title).map(stem);
        terms.forEach(function (term) { counts[term] = (counts[term] || 0) + 1; });
        titleTerms.forEach(function (term) { titleCounts[term] = (titleCounts[term] || 0) + 1; });
        Object.keys(counts).forEach(function (term) { df[term] = (df[term] || 0) + 1; });
        Object.keys(titleCounts).forEach(function (term) { df[term] = (df[term] || 0) + 1; });
        return { chunk: chunk, counts: counts, titleCounts: titleCounts, length: terms.length || 1 };
      });
      return { docs: docs, df: df, total: docs.length };
    }

    function ensureIndex() {
      if (index || loading || failed) return;
      loading = true;
      status.textContent = "Loading the search index";
      fetch(root + "data/search-index.json").then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      }).then(function (data) {
        index = prepare(data);
        loading = false;
        if (input.value.trim()) run(input.value);
        else status.textContent = index.total + " passages indexed across " + data.pages + " pages. Type a few words.";
      }).catch(function () {
        loading = false;
        failed = true;
        status.textContent = "Search index unavailable. Open data/search-index.json directly, or use the resource and task pages.";
      });
    }

    function score(query) {
      var terms = tokenize(query).map(stem);
      if (!terms.length) return [];
      var unique = terms.filter(function (term, i) { return terms.indexOf(term) === i; });
      var scored = [];
      index.docs.forEach(function (doc) {
        var total = 0;
        unique.forEach(function (term) {
          var body = doc.counts[term] || 0;
          var title = doc.titleCounts[term] || 0;
          if (!body && !title) return;
          var idf = Math.log(1 + index.total / (1 + (index.df[term] || 0)));
          var density = body / (1 + Math.log(1 + doc.length));
          total += idf * (density + title * 2.5);
        });
        if (total > 0) scored.push({ doc: doc, score: total });
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      return scored.slice(0, 20);
    }

    function escapeHtml(text) {
      return text.replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
      });
    }

    function snippet(text, terms) {
      var lower = text.toLowerCase();
      var at = -1;
      terms.forEach(function (term) {
        var found = lower.indexOf(term);
        if (found !== -1 && (at === -1 || found < at)) at = found;
      });
      if (at === -1) at = 0;
      var start = Math.max(0, at - 70);
      var out = text.slice(start, start + 240);
      return (start > 0 ? "\u2026" : "") + out + (start + 240 < text.length ? "\u2026" : "");
    }

    function highlight(text, terms) {
      var safe = escapeHtml(text);
      if (!terms.length) return safe;
      var pattern = terms.slice().sort(function (a, b) { return b.length - a.length; })
        .map(function (term) { return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
        .join("|");
      if (!pattern) return safe;
      return safe.replace(new RegExp("(" + pattern + ")", "gi"), "<mark>$1</mark>");
    }

    function render(list, terms) {
      results.textContent = "";
      active = -1;
      if (!list.length) {
        status.textContent = "No passage matches those words. Try a tool name, a task, or a term like contrast, motion or licence.";
        return;
      }
      status.textContent = list.length + (list.length === 20 ? "+" : "") + " matches, best first";
      list.forEach(function (entry) {
        var chunk = entry.doc.chunk;
        var link = el("a", {
          className: "result",
          href: root + chunk.url_html,
          "data-result": "true"
        });
        var title = el("h3", { text: chunk.page_title + (chunk.title ? " \u00b7 " + chunk.title : "") });
        var body = el("p");
        body.innerHTML = highlight(snippet(chunk.text, terms), terms);
        var where = el("span", { className: "where", text: chunk.url_md });
        link.appendChild(title);
        link.appendChild(body);
        link.appendChild(where);
        var item = el("li");
        item.appendChild(link);
        results.appendChild(item);
      });
    }

    function run(query) {
      if (!index) { ensureIndex(); return; }
      var trimmed = query.trim();
      if (!trimmed) {
        results.textContent = "";
        status.textContent = index.total + " passages indexed across " + index.pages + " pages. Type a few words.";
        return;
      }
      var terms = tokenize(trimmed).map(stem);
      render(score(trimmed), terms);
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set("q", trimmed);
        window.history.replaceState(null, "", url);
      }
    }

    function move(delta) {
      var links = Array.prototype.slice.call(results.querySelectorAll(".result"));
      if (!links.length) return;
      if (active >= 0) links[active].removeAttribute("data-active");
      active = (active + delta + links.length) % links.length;
      links[active].setAttribute("data-active", "true");
      links[active].focus();
    }

    input.addEventListener("input", function () { ensureIndex(); run(input.value); });
    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
      else if (event.key === "Escape") { input.value = ""; run(""); }
    });
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      run(input.value);
      var first = results.querySelector(".result");
      if (first) first.focus();
    });
    results.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
    });

    var params = new URLSearchParams(window.location.search);
    if (params.get("q")) input.value = params.get("q");
    ensureIndex();
    if (input.value.trim()) run(input.value);

    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
      }
    });
  }

  /* Recorded file tree */

  document.querySelectorAll("[data-tree]").forEach(function (mount) {
    var source = mount.dataset.tree;
    var repo = mount.dataset.repo;
    var commit = mount.dataset.commit;
    var listHost = mount.querySelector("[data-tree-rows]");
    var filter = mount.querySelector("[data-tree-filter]");
    var status = mount.querySelector("[data-tree-status]");
    var total = 0;

    function formatBytes(bytes) {
      if (!bytes) return "";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    function fileRow(entry) {
      var name = entry.path.split("/").pop();
      if (entry.kind === "submodule") {
        var row = el("div", { className: "tree-row" });
        row.appendChild(el("span", { className: "name", text: name }));
        row.appendChild(el("span", { className: "badge", text: "submodule" }));
        row.title = entry.path + " at commit " + (entry.gitlink_commit || "");
        return row;
      }
      var link = el("a", {
        className: "tree-row",
        href: repo + "/blob/" + commit + "/" + entry.path,
        rel: "noopener",
        title: entry.path + " on GitHub"
      });
      link.appendChild(el("span", { className: "name", text: name }));
      link.appendChild(el("span", { className: "size", text: formatBytes(entry.bytes) }));
      return link;
    }

    function build(entries) {
      var tree = { dirs: Object.create(null), files: [] };
      entries.forEach(function (entry) {
        var parts = entry.path.split("/");
        var node = tree;
        for (var i = 0; i < parts.length - 1; i += 1) {
          var name = parts[i];
          node.dirs[name] = node.dirs[name] || { dirs: Object.create(null), files: [] };
          node = node.dirs[name];
        }
        node.files.push(entry);
      });
      return tree;
    }

    function countFiles(node) {
      var n = node.files.length;
      Object.keys(node.dirs).forEach(function (name) { n += countFiles(node.dirs[name]); });
      return n;
    }

    function renderNode(node, host) {
      var ul = el("ul");
      Object.keys(node.dirs).sort().forEach(function (name) {
        var child = node.dirs[name];
        var li = el("li");
        var count = countFiles(child);
        var button = el("button", {
          type: "button",
          className: "tree-row dir",
          "aria-expanded": "false"
        });
        button.appendChild(chevron());
        button.appendChild(el("span", { className: "name", text: name + "/" }));
        button.appendChild(el("span", { className: "size", text: count + (count === 1 ? " file" : " files") }));
        var childHost = el("div", { hidden: "hidden" });
        button.addEventListener("click", function () {
          var open = button.getAttribute("aria-expanded") === "true";
          button.setAttribute("aria-expanded", open ? "false" : "true");
          if (open) childHost.setAttribute("hidden", "hidden");
          else childHost.removeAttribute("hidden");
        });
        li.appendChild(button);
        li.appendChild(childHost);
        renderNode(child, childHost);
        ul.appendChild(li);
      });
      node.files.slice().sort(function (a, b) { return a.path.localeCompare(b.path); })
        .forEach(function (entry) {
          var li = el("li");
          li.appendChild(fileRow(entry));
          ul.appendChild(li);
        });
      host.appendChild(ul);
    }

    function chevron() {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "12");
      svg.setAttribute("height", "12");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M9 6l6 6-6 6");
      svg.appendChild(path);
      return svg;
    }

    function flatMatches(entries, query) {
      var q = query.toLowerCase();
      return entries.filter(function (entry) { return entry.path.toLowerCase().indexOf(q) !== -1; });
    }

    fetch(root + source).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    }).then(function (data) {
      total = data.path_count;
      if (status) {
        status.textContent = data.path_count.toLocaleString("en") + " recorded paths, " +
          data.file_count.toLocaleString("en") + " files" +
          (data.submodule_count ? " and " + data.submodule_count + " submodule references" : "");
      }
      renderNode(build(data.entries), listHost);
      if (filter) {
        var timer = null;
        filter.addEventListener("input", function () {
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            var query = filter.value.trim();
            listHost.textContent = "";
            if (!query) {
              renderNode(build(data.entries), listHost);
              if (status) status.textContent = data.path_count.toLocaleString("en") + " recorded paths";
              return;
            }
            var matches = flatMatches(data.entries, query);
            var shown = matches.slice(0, 300);
            var ul = el("ul");
            shown.forEach(function (entry) {
              var li = el("li");
              li.appendChild(fileRow(entry));
              li.querySelector(".name").textContent = entry.path;
              ul.appendChild(li);
            });
            listHost.appendChild(ul);
            if (status) {
              status.textContent = matches.length.toLocaleString("en") + " of " +
                data.path_count.toLocaleString("en") + " paths match" +
                (matches.length > 300 ? ", first 300 shown" : "");
            }
          }, 120);
        });
        filter.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            filter.value = "";
            filter.dispatchEvent(new Event("input"));
          }
        });
      }
    }).catch(function () {
      if (status) status.textContent = "The recorded tree could not be loaded here. The same data is in " + source;
    });
  });

  /* Knowledge graph */

  var graph = document.querySelector("[data-graph]");
  if (graph) {
    var nodes = Array.prototype.slice.call(graph.querySelectorAll(".graph-node"));
    var edges = Array.prototype.slice.call(graph.querySelectorAll(".graph-edge"));
    var detail = document.querySelector("[data-graph-detail]");
    var edgeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-edge-filter]"));
    var activeType = "all";

    function clearHighlight() {
      nodes.forEach(function (node) { node.removeAttribute("data-dim"); node.removeAttribute("data-active"); });
      edges.forEach(function (edge) { edge.removeAttribute("data-dim"); });
    }

    function highlight(id) {
      var neighbours = Object.create(null);
      neighbours[id] = true;
      edges.forEach(function (edge) {
        if (edge.dataset.from === id) neighbours[edge.dataset.to] = true;
        if (edge.dataset.to === id) neighbours[edge.dataset.from] = true;
      });
      nodes.forEach(function (node) {
        if (neighbours[node.dataset.id]) node.removeAttribute("data-dim");
        else node.setAttribute("data-dim", "true");
        if (node.dataset.id === id) node.setAttribute("data-active", "true");
      });
      edges.forEach(function (edge) {
        var touches = edge.dataset.from === id || edge.dataset.to === id;
        edge.setAttribute("data-dim", touches ? "false" : "true");
      });
    }

    function showDetail(node) {
      if (!detail) return;
      var id = node.dataset.id;
      var label = node.dataset.label;
      var type = node.dataset.type;
      var href = node.dataset.href;
      detail.textContent = "";
      detail.appendChild(el("h3", { text: label }));
      detail.appendChild(el("p", { className: "muted small", text: type + " \u00b7 " + id }));
      if (href) {
        var link = el("a", { href: href, className: "small", text: "Open this page" });
        detail.appendChild(link);
      }
      var related = edges.filter(function (edge) {
        return edge.dataset.from === id || edge.dataset.to === id;
      }).map(function (edge) {
        var other = edge.dataset.from === id ? edge.dataset.to : edge.dataset.from;
        return { type: edge.dataset.type, other: other, note: edge.dataset.note || "" };
      });
      if (related.length) {
        var ul = el("ul");
        related.forEach(function (item) {
          var li = el("li");
          var targetNode = nodes.filter(function (n) { return n.dataset.id === item.other; })[0];
          var name = targetNode ? targetNode.dataset.label : item.other;
          li.appendChild(document.createTextNode(item.type + ": "));
          if (targetNode) {
            var a = el("a", { href: targetNode.dataset.href, text: name });
            li.appendChild(a);
          } else {
            li.appendChild(document.createTextNode(name));
          }
          if (item.note) li.appendChild(el("span", { className: "muted", text: " " + item.note }));
          ul.appendChild(li);
        });
        detail.appendChild(ul);
      } else {
        detail.appendChild(el("p", { className: "muted small", text: "No typed relationships recorded for this node." }));
      }
    }

    nodes.forEach(function (node) {
      node.addEventListener("mouseenter", function () { highlight(node.dataset.id); });
      node.addEventListener("mouseleave", clearHighlight);
      node.addEventListener("focus", function () { highlight(node.dataset.id); showDetail(node); });
      node.addEventListener("click", function () { showDetail(node); highlight(node.dataset.id); });
      node.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showDetail(node);
          highlight(node.dataset.id);
        }
      });
    });

    edgeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeType = button.dataset.edgeFilter;
        edgeButtons.forEach(function (other) {
          other.setAttribute("aria-pressed", other.dataset.edgeFilter === activeType ? "true" : "false");
        });
        edges.forEach(function (edge) {
          edge.hidden = activeType !== "all" && edge.dataset.type !== activeType;
        });
        clearHighlight();
      });
    });
  }
})();
