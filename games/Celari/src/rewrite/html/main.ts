import { parseDocument, DomUtils } from "htmlparser2";
import serialize from "dom-serializer";

import rewriteURL from "../lib/url";
import $config from "../../config";

function getOrigin(url: any) {
  if (!url.pathname.startsWith($config.prefix)) {
    return false;
  }
  return $config.decodeUrl(url.pathname.slice($config.prefix.length));
}

function rewriteHTML(html: string, url: any) {
  const origin = getOrigin(url);
  const base = new URL(origin);
  const dom = parseDocument(html);
  const nodes = DomUtils.findAll(() => true, dom);

  let attrToRewrite = new Set([
    "src",
    "href",
    "action",
    "formaction",
    "longdesc",
    "background",
    "cite",
    "data",
    "profile",
    "xlink:href",
    "usemap",
    "manifest",
    "archive",
    "codebase",
    "poster",
  ]);

  const targets = DomUtils.findAll(
    (el) =>
      el.attribs && Object.keys(el.attribs).some((a) => attrToRewrite.has(a)),
    dom,
  );

  targets.forEach((el) => {
    Object.keys(el.attribs).forEach((a) => {
      if (attrToRewrite.has(a)) {
        el.attribs[`celari-origattr-${a}`] = el.attribs[a];
        el.attribs[a] = rewriteURL(el.attribs[a], base.origin);
      }
    });
  });

  let stringed = serialize(dom);
  // slot that config in 
  return stringed.replace(
    /<head(\s*[^>]*)?>/, 
    (match) => `${match}\n<script src="${$config.configUrl}"></script><script src="${$config.clientUrl}"></script>`,
  );
}

export { rewriteHTML };
