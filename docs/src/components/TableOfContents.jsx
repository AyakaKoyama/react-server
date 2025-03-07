"use client";

import { useEffect, useState } from "react";

import { scrollHashIntoView } from "./utils.mjs";

export default function TableOfContents({ title }) {
  const [tableOfContents, setTableOfContents] = useState([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const tableOfContents = Array.from(
      document.querySelectorAll("article h1, article a[href^='#']")
    ).map((element) => ({
      label:
        element.tagName === "H1"
          ? element.textContent
          : element.parentElement.textContent.replace("#", "").trim(),
      href: element.getAttribute("href") ?? "#",
      el: element.tagName === "H1" ? element : element.parentElement,
      indent:
        element.tagName === "H1"
          ? 0
          : (parseInt(
              element.parentElement.querySelector("h2, h3, h4, h5, h6")
                ?.tagName[1]
            ) ?? 1) - 1,
    }));

    setTableOfContents(tableOfContents);

    const sections = [];
    let sectionRatio = [];
    const elementRatio = new WeakMap();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          const i = sections.findIndex((section) => section.includes(el));
          elementRatio.set(el, entry.intersectionRatio);
          if (i === -1) return;
          sectionRatio[i] =
            sections[i].reduce((acc, el) => acc + elementRatio.get(el), 0) /
            sections[i].length;
        });

        const activeSection = sectionRatio.reduce((index, ratio, i) => {
          if (ratio === 1 && i === sectionRatio.length - 1) return i;
          if (ratio > sectionRatio[index]) return i;
          return index;
        }, 0);

        setActive(tableOfContents[activeSection].href);
      },
      { threshold: [0.1, 0.5, 1] }
    );

    Array.from(document.querySelector("article").children).forEach((el) => {
      if (el.getAttribute("data-no-content")) return;
      if (tableOfContents.some((item) => item.el === el)) {
        sections.push([]);
      }
      sections[sections.length - 1]?.push(el);
      elementRatio.set(el, 0);
      observer.observe(el);
    });

    const handleHashChange = () => {
      setActive(window.location.hash);

      document.querySelectorAll("input[type='checkbox']").forEach((el) => {
        el.checked = false;
      });
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <>
      <header className="text-md font-semibold mb-2 whitespace-nowrap">
        {title}
      </header>
      <ul className="flex flex-col w-40">
        {tableOfContents.map((item, i) => (
          <li
            key={item.href}
            className="first:border-none pb-2 last:pb-0 border-l border-gray-300 dark:border-gray-600"
          >
            <a
              href={item.href}
              className={`block max-w-full after:mb-[-1px] !whitespace-normal text-xs${
                (
                  item.href === "#"
                    ? active === "#"
                    : active?.includes(item.href)
                )
                  ? " text-indigo-500 dark:text-yellow-600 active"
                  : ""
              } ${item.indent === 0 ? "font-semibold" : ""}`}
              style={{
                paddingLeft: i > 0 ? `${item.indent / 2 + 0.25}rem` : "0",
              }}
              title={item.label}
              onClick={(e) => {
                e.preventDefault();
                scrollHashIntoView(item.href);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
