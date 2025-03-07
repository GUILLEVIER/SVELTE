import { render, screen, waitFor } from "@testing-library/svelte";
import UserList from "./UserList.svelte";
import { setupServer } from "msw/node";
import { rest } from "msw";
import userEvent from "@testing-library/user-event";
import en from "../locale/en.json";
import tr from "../locale/tr.json";
import LanguageSelector from "./LanguageSelector.svelte";

const server = setupServer();

beforeAll(() => server.listen());

beforeEach(() => server.resetHandlers());

afterAll(() => server.close());

describe("User List", () => {
  beforeEach(() => {
    server.use(
      rest.get("/api/1.0/users", (req, res, ctx) => {
        let page = Number.parseInt(req.url.searchParams.get("page"));
        let size = Number.parseInt(req.url.searchParams.get("size"));
        if (Number.isNaN(page)) {
          page = 0;
        }
        if (Number.isNaN(size)) {
          size = 5;
        }
        return res(ctx.status(200), ctx.json(getPage(page, size)));
      })
    );
  });

  it("displays three users in list", async () => {
    render(UserList);
    await waitFor(() => {
      const userList = screen.queryAllByText(/user/);
      expect(userList.length).toBe(3);
    });
  });
  it("displays next page link", async () => {
    render(UserList);
    await screen.findByText("user1");
    expect(screen.queryByText("next >")).toBeInTheDocument();
  });
  it("displays next page after clicking next", async () => {
    render(UserList);
    await screen.findByText("user1");
    const nextPage = screen.queryByText("next >");
    await userEvent.click(nextPage);
    const firstUserOnPage2 = await screen.findByText("user4");
    expect(firstUserOnPage2).toBeInTheDocument();
  });
  it("hides next page link at last page", async () => {
    render(UserList);
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user7");
    expect(screen.queryByText("next >")).not.toBeInTheDocument();
  });
  it("does not display previous page link in the first page", async () => {
    render(UserList);
    await screen.findByText("user1");
    expect(screen.queryByText("< previous")).not.toBeInTheDocument();
  });
  it("displays previous page link in page 2", async () => {
    render(UserList);
    await screen.findByText("user1");
    const nextPage = screen.queryByText("next >");
    await userEvent.click(nextPage);
    await screen.findByText("user4");
    expect(screen.queryByText("< previous")).toBeInTheDocument();
  });
  it("displays previous page after clicking previous page link", async () => {
    render(UserList);
    await screen.findByText("user1");
    const nextPage = screen.queryByText("next >");
    await userEvent.click(nextPage);
    await screen.findByText("user4");
    const previousPage = screen.queryByText("< previous");
    await userEvent.click(previousPage);
    const firstUserOnPage1 = await screen.findByText("user1");
    expect(firstUserOnPage1).toBeInTheDocument();
  });
  it("displays spinner while the api call is in progress", () => {
    render(UserList);
    const spinner = screen.queryByRole("status");
    expect(spinner).toBeInTheDocument();
  });
  it("hides spinner when api call is completed", async () => {
    render(UserList);
    const spinner = screen.queryByRole("status");
    await screen.findByText("user1");
    expect(spinner).not.toBeInTheDocument();
  });
});

describe("Internationalization", () => {
  let turkishToggle;
  const setup = () => {
    render(UserList);
    render(LanguageSelector);
    turkishToggle = screen.getByTitle("Türkçe");
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  beforeEach(() => {
    server.use(
      rest.get("/api/1.0/users", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(getPage(1, 3)));
      })
    );
  });

  it("initially displays header and navigation links in english", async () => {
    setup();
    await screen.findByText("user4");
    expect(screen.queryByText(en.users)).toBeInTheDocument();
    expect(screen.queryByText(en.nextPage)).toBeInTheDocument();
    expect(screen.queryByText(en.previousPage)).toBeInTheDocument();
  });

  it("displays header and navigation links in Turkish after selecting that language", async () => {
    setup();
    await screen.findByText("user4");
    await userEvent.click(turkishToggle);
    expect(screen.queryByText(tr.users)).toBeInTheDocument();
    expect(screen.queryByText(tr.nextPage)).toBeInTheDocument();
    expect(screen.queryByText(tr.previousPage)).toBeInTheDocument();
  });
});

const getPage = (page, size) => {
  let start = page * size;
  let end = start + size;
  let totalPages = Math.ceil(users.length / size);
  return {
    content: users.slice(start, end),
    page,
    size,
    totalPages,
  };
};

const users = [
  {
    id: 1,
    username: "user1",
    email: "user1@mail.com",
    image: null,
  },
  {
    id: 2,
    username: "user2",
    email: "user2@mail.com",
    image: null,
  },
  {
    id: 3,
    username: "user3",
    email: "user3@mail.com",
    image: null,
  },
  {
    id: 4,
    username: "user4",
    email: "user4@mail.com",
    image: null,
  },
  {
    id: 5,
    username: "user5",
    email: "user5@mail.com",
    image: null,
  },
  {
    id: 6,
    username: "user6",
    email: "user6@mail.com",
    image: null,
  },
  {
    id: 7,
    username: "user7",
    email: "user7@mail.com",
    image: null,
  },
];
