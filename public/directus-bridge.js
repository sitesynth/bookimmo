(function () {
  var DIRECTUS_BASE = (window.BOOKIMMO_DIRECTUS_URL || "https://cms.book.immo").replace(/\/$/, "");
  var DIRECTUS_PROXY = "/api/directus";
  var ACTIVE_LOCALE = "en";
  var MESSAGES = {};

  function directusAssetUrl(fileId) {
    return DIRECTUS_BASE + "/assets/" + encodeURIComponent(fileId) + "?fit=cover&width=1200&height=1200&quality=80";
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
      return res.json();
    });
  }

  function directusApiGet(path, query) {
    var params = new URLSearchParams();
    params.set("path", path);
    if (query) params.set("query", query);
    return fetchJson(DIRECTUS_PROXY + "?" + params.toString());
  }

  function directusApiPost(path, payload) {
    var params = new URLSearchParams();
    params.set("path", path);
    return fetchJson(DIRECTUS_PROXY + "?" + params.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
  }

  function text(el) {
    return (el && (el.textContent || "").trim()) || "";
  }

  function setText(el, value) {
    if (el && typeof value === "string" && value.length > 0) el.textContent = value;
  }

  function t(key, fallback) {
    return MESSAGES[key] || fallback || "";
  }

  function findAgentCards() {
    return Array.prototype.slice.call(document.querySelectorAll(".framer-1huqr8v-container .framer-1XAtZ"));
  }

  function updateAgents() {
    var query =
      "filter[status][_eq]=published" +
      "&sort[]=-is_featured&sort[]=-date_created" +
      "&limit=24" +
      "&fields=full_name,role_label,listings_count,avatar";

    return directusApiGet("/items/agents", query)
      .then(function (payload) {
        var agents = (payload && payload.data) || [];
        if (!agents.length) return;

        var cards = findAgentCards();
        if (!cards.length) return;

        cards.forEach(function (card, index) {
          var agent = agents[index % agents.length];
          if (!agent) return;

          var nameEl = card.querySelector("h6");
          var roleEl = card.querySelector(".framer-qdgec p");
          var countEl = card.querySelector(".framer-uzrc5l p");
          var imgEl = card.querySelector('img[alt="Agent image"]');

          setText(nameEl, agent.full_name || text(nameEl));
          setText(roleEl, agent.role_label || text(roleEl));

          if (countEl && agent.listings_count !== null && agent.listings_count !== undefined) {
            countEl.textContent = String(agent.listings_count);
          }

          if (imgEl && agent.avatar) {
            var asset = directusAssetUrl(agent.avatar);
            imgEl.src = asset;
            imgEl.srcset = asset + " 1200w";
          }
        });
      })
      .catch(function (err) {
        console.warn("[bookimmo] agents sync failed:", err);
      });
  }

  function formatPrice(value, currency) {
    var amount = Number(value);
    if (!isFinite(amount)) return "";
    var safeCurrency = (currency || "USD").toUpperCase();
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: safeCurrency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (e) {
      return "$ " + Math.round(amount).toLocaleString("en-US");
    }
  }

  function uniqueVisibleCardsFromPropertyImages() {
    var seen = new Set();
    var cards = [];
    var images = document.querySelectorAll('img[alt^="Property image"]');
    images.forEach(function (img) {
      var card = img.closest('[data-highlight="true"]');
      if (!card) return;
      if (seen.has(card)) return;
      seen.add(card);
      var hiddenVariant = card.closest(".ssr-variant.hidden-olbwcu, .ssr-variant.hidden-1woyh6i, .ssr-variant.hidden-72rtr7");
      if (hiddenVariant) return;
      cards.push(card);
    });
    return cards;
  }

  function updatePropertyCard(card, property) {
    if (!card || !property) return;

    var titleEl =
      card.querySelector('[data-framer-name="Gorgeous Villa for Rent"] p') ||
      card.querySelector(".framer-1wkyxtb p, .framer-1h4qxg8 p");
    var cityEl =
      card.querySelector('[data-framer-name="Greenville, Jersey City"] p') ||
      card.querySelector(".framer-1818x2k p, .framer-r7ix7b p");
    var descEl =
      card.querySelector('[data-framer-name*="Mckinley Hill"] p') ||
      card.querySelector(".framer-7638c p");
    var priceEl = card.querySelector('[data-framer-name*="$"] p') || card.querySelector(".framer-f8yopp p");
    var imgEl = card.querySelector('img[alt^="Property image"]');

    var metaEls = card.querySelectorAll('[data-framer-name="Metadata"] p');

    setText(titleEl, property.title || text(titleEl));
    setText(cityEl, property.city_slug || property.address || text(cityEl));
    setText(descEl, property.short_description || text(descEl));

    var formattedPrice = formatPrice(property.price, property.currency);
    if (formattedPrice) setText(priceEl, formattedPrice);

    if (metaEls && metaEls.length >= 3) {
      if (property.bedrooms !== null && property.bedrooms !== undefined) metaEls[0].textContent = String(property.bedrooms) + " Bedroom";
      if (property.bathrooms !== null && property.bathrooms !== undefined) metaEls[1].textContent = String(property.bathrooms) + " Bathroom";
      if (property.area_m2 !== null && property.area_m2 !== undefined) metaEls[2].textContent = String(property.area_m2) + " m²";
    }

    if (imgEl && property.cover_image) {
      var asset = directusAssetUrl(property.cover_image);
      imgEl.src = asset;
      imgEl.srcset = asset + " 1200w";
    }
  }

  function updateProperties() {
    var query =
      "filter[status][_eq]=published" +
      "&sort[]=-is_featured&sort[]=-date_created" +
      "&limit=24" +
      "&fields=title,city_slug,address,short_description,bedrooms,bathrooms,area_m2,price,currency,cover_image";

    return directusApiGet("/items/properties", query)
      .then(function (payload) {
        var properties = (payload && payload.data) || [];
        if (!properties.length) return;

        var cards = uniqueVisibleCardsFromPropertyImages();
        if (!cards.length) return;

        cards.forEach(function (card, index) {
          var property = properties[index % properties.length];
          updatePropertyCard(card, property);
        });
      })
      .catch(function (err) {
        console.warn("[bookimmo] properties sync failed:", err);
      });
  }

  function updateBlogPosts() {
    var cards = document.querySelectorAll('[data-bookimmo-blog-card], .bookimmo-blog-card');
    if (!cards.length) return Promise.resolve();
    var query =
      "filter[status][_eq]=published" +
      "&sort[]=-published_at&sort[]=-date_created" +
      "&limit=12" +
      "&fields=title,slug,excerpt,cover_image,published_at,author_name";

    return directusApiGet("/items/blog_posts", query)
      .then(function (payload) {
        var posts = (payload && payload.data) || [];
        if (!posts.length) return;
        cards.forEach(function (card, index) {
          var post = posts[index % posts.length];
          var titleEl = card.querySelector("[data-bookimmo-blog-title], h3, h4, h5, p");
          var excerptEl = card.querySelector("[data-bookimmo-blog-excerpt]");
          var imgEl = card.querySelector("img");
          var linkEl = card.querySelector("a");
          setText(titleEl, post.title || text(titleEl));
          setText(excerptEl, post.excerpt || text(excerptEl));
          if (imgEl && post.cover_image) {
            var asset = directusAssetUrl(post.cover_image);
            imgEl.src = asset;
            imgEl.srcset = asset + " 1200w";
          }
          if (linkEl && post.slug) {
            linkEl.href = "/blog/" + post.slug;
          }
        });
      })
      .catch(function (err) {
        console.warn("[bookimmo] blog sync failed:", err);
      });
  }

  function injectBlogMenuLink() {
    var existing = document.querySelectorAll('a[href="./pages/blog.html"], a[href="/pages/blog.html"]');
    if (existing.length) return;

    var navAnchors = document.querySelectorAll('a[href="./dashboard-home"], a[href="./search"], a[href="./agent"]');
    if (!navAnchors.length) return;

    var touched = new Set();
    navAnchors.forEach(function (anchor) {
      var nav = anchor.closest("nav, .framer-ivn56n, .framer-f4d4gy, .framer-4nfpj5, .framer-k9z9h4, .framer-3r4n3j");
      if (!nav || touched.has(nav)) return;
      touched.add(nav);

      var blog = document.createElement("a");
      blog.href = "./pages/blog.html";
      blog.textContent = "Blog";
      blog.style.textDecoration = "none";
      blog.style.color = "inherit";
      blog.style.font = "inherit";
      blog.style.opacity = "1";
      blog.setAttribute("data-bookimmo-nav", "blog");

      var ref = nav.querySelector('a[href="./agent"]') || nav.querySelector('a[href="./search"]');
      if (ref && ref.parentElement && ref.parentElement !== nav) {
        ref.parentElement.insertAdjacentElement("afterend", blog);
      } else if (ref) {
        ref.insertAdjacentElement("afterend", blog);
      } else {
        nav.appendChild(blog);
      }
    });
  }

  function detectLocaleFromPath() {
    var p = window.location.pathname || "/";
    if (p === "/de" || p.indexOf("/de/") === 0) return "de";
    if (p === "/fr" || p.indexOf("/fr/") === 0) return "fr";
    if (p === "/it" || p.indexOf("/it/") === 0) return "it";
    if (p === "/nl" || p.indexOf("/nl/") === 0) return "nl";
    if (p === "/en" || p.indexOf("/en/") === 0) return "en";
    return "";
  }

  function setLangCookie(lang) {
    if (!lang) return;
    document.cookie = "lang=" + lang + "; path=/; max-age=31536000; samesite=lax";
  }

  function loadMessages(locale) {
    return fetch("/public/i18n/" + locale + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("i18n load failed " + r.status);
        return r.json();
      })
      .catch(function () {
        return {};
      });
  }

  function localizeHref(href, locale) {
    if (!href) return href;
    if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return href;
    if (href.indexOf("#") === 0) return href;
    if (href.indexOf("/_local/") === 0 || href.indexOf("/public/") === 0) return href;
    if (href.indexOf("/de") === 0 || href.indexOf("/fr") === 0 || href.indexOf("/it") === 0 || href.indexOf("/nl") === 0 || href.indexOf("/en") === 0) {
      return "/" + locale + href.replace(/^\/(en|de|fr|it|nl)/, "");
    }
    if (href === "/") return "/" + locale;

    var normalized = href;
    if (normalized.indexOf("./") === 0) normalized = normalized.slice(1);
    if (normalized.indexOf("/") === 0) return "/" + locale + normalized;
    return "/" + locale + "/" + normalized.replace(/^\/+/, "");
  }

  function localizeInternalLinks(locale) {
    var links = document.querySelectorAll("a[href]");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      var next = localizeHref(href, locale);
      if (next) a.setAttribute("href", next);
    });
  }

  function applyLocaleToStaticUI() {
    document.documentElement.lang = ACTIVE_LOCALE;
    localizeInternalLinks(ACTIVE_LOCALE);

    var mapByHref = [
      { href: "./dashboard-home", key: "nav.latest", fallback: "Latest Properties" },
      { href: "./search", key: "nav.search", fallback: "Search Properties" },
      { href: "./agent", key: "nav.agent", fallback: "Agent" },
      { href: "./log-in", key: "nav.login", fallback: "Log in" },
      { href: "./sign-up", key: "nav.signup", fallback: "Sign up" },
      { href: "./pages/blog.html", key: "nav.blog", fallback: "Blog" }
    ];

    mapByHref.forEach(function (item) {
      var selectors = [
        'a[href="' + localizeHref(item.href, ACTIVE_LOCALE) + '"]',
        'a[href="' + item.href + '"]'
      ];
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (node) {
          if (text(node) && text(node).length < 40) node.textContent = t(item.key, item.fallback);
        });
      });
    });

    setText(document.querySelector("#featured-properties h2"), t("featured.title", "Featured Properties"));
    setText(
      document.querySelector('#featured-properties [data-framer-name*="Explore the latest"] p'),
      t("featured.subtitle", "Explore highlighted properties.")
    );
    setText(document.querySelector("#newsletter h3"), t("newsletter.title", "There is always something new! Don’t miss out."));
    setText(
      document.querySelector('#newsletter [data-framer-name*="Get property updates"] p'),
      t("newsletter.subtitle", "Get property updates and the latest on pricing for your next property decision.")
    );

    var newsletterEmail = document.querySelector('form.framer-79ac4b input[type="email"]');
    if (newsletterEmail) newsletterEmail.placeholder = t("form.newsletter.placeholder", newsletterEmail.placeholder || "Enter email address");
    var contactName = document.querySelector('form.framer-3kpb72 input[name="Name"]');
    if (contactName) contactName.placeholder = t("form.contact.name", contactName.placeholder || "Jane Smith");
    var contactEmail = document.querySelector('form.framer-3kpb72 input[type="email"]');
    if (contactEmail) contactEmail.placeholder = t("form.contact.email", contactEmail.placeholder || "Email");
    var contactMessage = document.querySelector("form.framer-3kpb72 textarea");
    if (contactMessage) contactMessage.placeholder = t("form.contact.message", contactMessage.placeholder || "Hello book.immo");

    document.querySelectorAll('form button[type="submit"] p, form button[type="submit"] span').forEach(function (node) {
      if (!node.dataset.originalText || /submit|отправ/i.test(node.dataset.originalText) || /submit|отправ/i.test(node.textContent || "")) {
        var label = t("form.submit", "Submit");
        node.textContent = label;
        node.dataset.originalText = label;
      }
    });
  }

  function localeHref(targetLocale) {
    var path = window.location.pathname || "/";
    var suffix = path.replace(/^\/(en|de|fr|it|nl)(?=\/|$)/, "");
    if (!suffix) suffix = "/";
    return "/" + targetLocale + (suffix === "/" ? "" : suffix);
  }

  function injectLanguageSwitcher() {
    if (document.querySelector("[data-bookimmo-lang-switch]")) return;
    var navs = document.querySelectorAll("nav, .framer-ivn56n, .framer-f4d4gy, .framer-4nfpj5, .framer-k9z9h4, .framer-3r4n3j");
    if (!navs.length) return;
    var active = ACTIVE_LOCALE || detectLocaleFromPath() || "en";
    navs.forEach(function (nav) {
      var wrap = document.createElement("span");
      wrap.setAttribute("data-bookimmo-lang-switch", "true");
      wrap.style.display = "inline-flex";
      wrap.style.gap = "8px";
      wrap.style.marginLeft = "8px";

      ["en", "de", "fr", "it", "nl"].forEach(function (lang) {
        var a = document.createElement("a");
        a.href = localeHref(lang);
        a.textContent = lang.toUpperCase();
        a.style.textDecoration = "none";
        a.style.color = "inherit";
        a.style.opacity = lang === active ? "1" : "0.65";
        a.style.fontWeight = lang === active ? "700" : "500";
        a.addEventListener("click", function () {
          setLangCookie(lang);
        });
        wrap.appendChild(a);
      });

      nav.appendChild(wrap);
    });
  }

  function setButtonsState(form, submitting) {
    var buttons = form.querySelectorAll('button[type="submit"]');
    buttons.forEach(function (button) {
      button.disabled = submitting;
      button.style.opacity = submitting ? "0.7" : "1";
      var textNode = button.querySelector("p, span") || button;
      if (!textNode.dataset) return;
      if (!textNode.dataset.originalText) {
        textNode.dataset.originalText = textNode.textContent;
      }
      textNode.textContent = submitting ? t("form.sending", "Sending...") : textNode.dataset.originalText;
    });
  }

  function flashFormStatus(form, ok, message) {
    var status = form.querySelector(".bookimmo-form-status");
    if (!status) {
      status = document.createElement("div");
      status.className = "bookimmo-form-status";
      status.style.fontSize = "12px";
      status.style.marginTop = "10px";
      form.appendChild(status);
    }
    status.textContent = message;
    status.style.color = ok ? "#0b7a4b" : "#b3261e";
  }

  function submitLead(payload) {
    return directusApiPost("/items/leads", payload);
  }

  function wireNewsletterForm() {
    var form = document.querySelector("form.framer-79ac4b");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = form.querySelector('input[type="email"]');
      var email = (emailInput && emailInput.value || "").trim();
      if (!email) {
        flashFormStatus(form, false, t("form.newsletter.required", "Please enter your email."));
        return;
      }

      setButtonsState(form, true);
      submitLead({
        full_name: "Newsletter Subscriber",
        email: email,
        message: "Newsletter signup",
        source: "newsletter",
        page_url: window.location.href,
      })
        .then(function () {
          form.reset();
          flashFormStatus(form, true, t("form.newsletter.ok", "Thanks. You are subscribed."));
        })
        .catch(function (err) {
          console.warn("[bookimmo] newsletter lead failed:", err);
          flashFormStatus(form, false, t("form.newsletter.error", "Failed to submit. Please try again."));
        })
        .finally(function () {
          setButtonsState(form, false);
        });
    });
  }

  function wireContactForm() {
    var form = document.querySelector("form.framer-3kpb72");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nameInput = form.querySelector('input[name="Name"]');
      var emailInput = form.querySelector('input[type="email"]');
      var messageInput = form.querySelector("textarea");

      var fullName = (nameInput && nameInput.value || "").trim();
      var email = (emailInput && emailInput.value || "").trim();
      var message = (messageInput && messageInput.value || "").trim();

      if (!fullName || !email) {
        flashFormStatus(form, false, t("form.contact.required", "Please fill name and email."));
        return;
      }

      setButtonsState(form, true);
      submitLead({
        full_name: fullName,
        email: email,
        message: message || "Contact request",
        source: "contact-form",
        page_url: window.location.href,
      })
        .then(function () {
          form.reset();
          flashFormStatus(form, true, t("form.contact.ok", "Thanks. We will contact you shortly."));
        })
        .catch(function (err) {
          console.warn("[bookimmo] contact lead failed:", err);
          flashFormStatus(form, false, t("form.contact.error", "Failed to submit. Please try again."));
        })
        .finally(function () {
          setButtonsState(form, false);
        });
    });
  }

  function init() {
    var locale = detectLocaleFromPath() || "en";
    ACTIVE_LOCALE = locale;
    setLangCookie(locale);
    loadMessages(locale).then(function (payload) {
      MESSAGES = payload || {};
      applyLocaleToStaticUI();
      injectLanguageSwitcher();
      injectBlogMenuLink();
    });
    updateAgents();
    updateProperties();
    updateBlogPosts();
    wireNewsletterForm();
    wireContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
