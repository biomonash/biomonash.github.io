import { UserConfig } from "./src/config";

const userConfig: UserConfig = {
  base_url: "https://notion-hugo.pages.dev",
  mount: {
    manual: false,
    page_url:
      "https://app.notion.com/p/BiOM-Website-CMS-7106e8cb553e82229a25017dad35b257?source=copy_link",
    pages: [
      // {
      //     page_id: '<page_id>',
      //     target_folder: 'path/relative/to/content/folder'
      // }
      {
        page_id: "45eb121158b9489480ec000fd25c812b",
        target_folder: ".",
      },{
    page_id: "3e36e8cb553e8073ba48ef35ff8dd97f",
    target_folder: ".",
  },
    ],
    databases: [
      // {
      //     database_id: '<database_id>',
      //     target_folder: 'path/relative/to/content/folder'
      // }
      {
        database_id: "b7b1816c05ec464391c8c111fa242985",
        target_folder: ".",
      },
      {
        database_id: "3da6e8cb553e80e4b1cfdcabc77e6f75",
        target_folder: ".",
      },
      {
        database_id: "3e36e8cb553e80449fb3e43b5851a87e",
        target_folder: ".",
      },
    ],
  },
};

export default userConfig;
