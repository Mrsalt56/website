self.__celari__$config = {
  prefix: "/celari/prefix/",
  clientUrl: "/celari.client.js",
  configUrl: "/celari.config.js",
  errorPageUrl: "/error.html", // this is absolute peak
  // yall mfs can implement your own encoding
  encodeUrl: (x) => {
    return encodeURIComponent(x);
  },
  decodeUrl: (x) => {
    return decodeURIComponent(x);
  },
};
