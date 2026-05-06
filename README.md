# React Legacy Learning Lab

Interactive educational React MVP for learning legacy SPA runtime flow.

## Direction

- [Task 5. Observable Flow Playground 방향 리팩토링 요청서](docs/task-5-observable-flow-playground.md)

## Run

```bash
npm install
npm run dev
```

## Mock Query String

API responses are controlled from the browser URL:

```text
?mock=auth:200:session-restored,login:200:login-done,users:404:list-failed,write:200:create-done,delete:500:delete-failed
```

Format:

```text
apiKey:status:message
```

Supported API keys:

- `auth`
- `login`
- `users`
- `write`
- `delete`
