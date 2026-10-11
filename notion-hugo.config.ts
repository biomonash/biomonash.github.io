import { UserConfig } from "./src/config";

const userConfig: UserConfig = {
  base_url: "https://notion-hugo.pages.dev",
  mount: {
    manual: false,
    page_url:
      "https://app.notion.com/p/BiOM-Website-CMS-7106e8cb553e82229a25017dad35b257?source=copy_link",
    // Anything under the CMS page is found automatically.
    // List here only pages/databases that live OUTSIDE the CMS page.
    pages: [],
    databases: [
      {
        database_id: "3256e8cb553e80d289ffdd21f5618dca",
        target_folder: "members",
      },
      {
        database_id: "2696e8cb553e80c883cae7082d7f56f8",
        target_folder: "executives",
      },
       {
        database_id: "3f66e8cb553e809e8f0becba38271668",
        target_folder: "advisors",
      },
    ],
  },
};

export default userConfig;