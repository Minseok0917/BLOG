const path = require("path");
const markdownDirectory = path.resolve(__dirname, "../docs");

export default {
  title: "Minseok0917 Blog",
  description: "Minseok0917 의 블로그입니다.",
  base: "/BLOG/",
  srcDir: markdownDirectory,
  themeConfig: {
    sidebar: [
      {
        text: "Frontend",
        items: [
          {
            text: "API 선언 직관적으로 하는 법",
            link: "/frontend/clean-axios",
          },
        ],
      },
    ],
  },
};
