// TOOD - patch
//setAttribute, setAttributeNS, innerHTML, outerHTML, insertAdjeacentHTML, append, prepend, insertAdjacentElement, appendChild, insertBefore, and replaceChild
import rewriteURL from "../rewrite/lib/url";
import $config from "../config";


// typescript...
interface patchRegistry {
  elements: Function[];
  properties: string[];
  handler: "url" | "html" | "delete" | "window";
}

function getOrigin(url: any) {
  const u = url instanceof URL ? url : new URL(url);
  if (!u.pathname.startsWith($config.prefix)) return false;
  return $config.decodeUrl(u.pathname.slice($config.prefix.length));
}

function rewriteValue(value: string) {
  return rewriteURL(value, getOrigin(location.href));
}

window.Element.prototype.getAttribute = new Proxy(
  window.Element.prototype.getAttribute,
  {
    apply(target, thisArg, args) {
      if (args[0] && thisArg.hasAttribute(`celari-origattr-${args[0]}`)) {
        args[0] = `celari-origattr-${args[0]}`;
      }
      return Reflect.apply(target, thisArg, args);
    },
  },
);
// thanks whoever made https://github.com/titaniumnetwork-dev/Corrosion/blob/main/lib/browser/document.js
// without it i would have to read the docs for like 
// 3 weeks
let registry: patchRegistry[] = [
  {
    elements: [
      HTMLScriptElement,
      HTMLMediaElement,
      HTMLImageElement,
      HTMLAudioElement,
      HTMLVideoElement,
      HTMLInputElement,
      HTMLEmbedElement,
      HTMLIFrameElement,
      HTMLTrackElement,
      HTMLSourceElement,
    ],
    properties: ["src"],
    handler: "url",
  },
  {
    elements: [HTMLFormElement],
    properties: ["action"],
    handler: "url",
  },
  {
    elements: [
      HTMLAnchorElement,
      HTMLAreaElement,
      HTMLLinkElement,
      HTMLBaseElement,
    ],
    properties: ["href"],
    handler: "url",
  },
  {
    elements: [HTMLImageElement, HTMLSourceElement],
    properties: ["srcset"],
    handler: "html",
  },
  {
    elements: [HTMLScriptElement],
    properties: ["integrity"],
    handler: "delete",
  },
  {
    elements: [HTMLIFrameElement],
    properties: ["contentWindow"],
    handler: "window",
  },
];

registry.forEach(entry => {
  if (!entry) return;
  entry.elements.forEach(element => {
    if (!element) return;

    entry.properties.forEach(property => {
      const descriptor = Object.getOwnPropertyDescriptor(element.prototype, property);
      if (!descriptor) return
      Object.defineProperty(element.prototype, property, {
        get() {
          return this.getAttribute(`celari-origattr-${property}`)
        },
        set: descriptor.set ? new Proxy(descriptor.set!, {
          apply(target: Function, thisArg: any, args: any[]) {
            thisArg.setAttribute(`celari-origattr-${property}`, args[0])
            let rewritten = rewriteValue(args[0])
            return Reflect.apply(target, thisArg, [rewritten])
          }
        }) as (v: any) => void : undefined
      }) 
    }) 

  }) 
})