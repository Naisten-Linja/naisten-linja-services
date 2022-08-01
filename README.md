# Naisten Linja Services

This is the code for Naisten Linja's services including:

- [x] User authentication via Discourse SSO
- [x] Volunteer bookings management
- [x] Online letter API
- [x] Admin interface for staff and volunteer to answer to online letters

|                            |                                          |
| -------------------------- | ---------------------------------------- |
| Production app URL         | https://services.naistenlinja.fi         |
| Production Discourse URL   | https://ryhmat.naistenlinja.fi           |
| Development app URL        | https://services-dev.naistenlinja.fi     |
| Development Discourse URL  | https://online-group-dev.naistenlinja.fi |
| Frontend & backend hosting | Heroku                                   |
| Discourse hosting          | Upcloud VPS                              |
| DNS                        | Cloudflare                               |

## Development

### Prerequisites

Project requires Node.js version 14. Our dependencies are installed and managed via npm, and are defined in package.json.

To help managing node versions easily, we recommend using a node package manager like
[nvm](https://github.com/nvm-sh/nvm)

We are also using [direnv](https://direnv.net/) to automatically set environment variables as you switch directories.

### Development environment setup

Clone the project from GitHub and install required dependencies:

```shell
git clone git@github.com:Naisten-Linja/naisten-linja-services.git
cd naisten-linja-services
# install dependencies
npm i
```

### Environment variables

The following steps assume that you are using [direnv](https://direnv.net/). Also remember to hook
direnv into your preferred shell environment as described [here](https://direnv.net/docs/hook.html)
if that is not done before.

Copy over `.envrc.example` into `.envrc`, at the project root. Ask an existing team member to
provide you with the value for `DISCOURSE_SSO_SECRET`. You would also need to have an admin
account created in `online-group-dev.naistenlinja.fi` in order to login to the service.

```shell
cp .envrc.example .envrc

# approve the change of environment variables
direnv allow
```

If `direnv` hook is setup correctly, after making a change to the variables in `.envrc` file,
`direnv` will request you to run `direnv allow` for the new set of variables to take effect.

Also remember to update `.envrc.example` when removing, or introducing a new variable.

### Start the development environment

Once the database and environment variables are setup, run

```
npm run dev
```

This will start a docker container running PostgreSQL, another container running Redis, run database migration,
then start both the front and backend development app.

After that, the frontend app is accessible at http://localhost:3000 (`FRONTEND_PORT` was set in
`.envrc` to 3000 by default).

In case the database failed to start with this error `Bind for 0.0.0.0:5433 failed: port is already allocated`, it's
most likely another service is using port `5433` in your local environment. Try stopping that service. Alternatively,
change `DB_PORT` value in `.envrc` to a different one (`5434` for example), run `direnv allow && docker rm
naisten_linja_db`. This will update `DB_PORT` and remove the old `naisten_linja_db` container that was using the old
port forwarding setting. Then, try `npm run dev` again.

The same applies to Redis container as well.

### Making changes to the database schema

We are using [db-migrate](https://github.com/db-migrate/node-db-migrate) to manage database schema changes. All
migration files are located in `./db/migrations/` folder, which should not be modified if they are already deployed to
remote environments. New changes made to the database schema should be done through creating new migrations. Refer to
db-migrate's [documentation page](https://db-migrate.readthedocs.io/en/latest/) for more details.

A few basic `db-migrate` commands:

```
# Generate a new migration file at `./db/migrations/<timestamp>-your-migration-name.js`
db-migrate create your-migration-name
# Run all migrations
db-migrate up
# Run up to 3 migrations
db-migrate up -c 3
# Revert the latest migration
db-migrate down
# Revert up to 5 latest migrations
db-migrate down -c 5
```

### Modifications to `react-scripts` module

We are using `patch-package` to patch `react-script` and make `create-react-app` use `tsconfig.frontend.json` instead of
`tsconfig.json`. For this reason, the `react-script` version is fixed at `4.0.3` in `package.json`, and `patch-package`
will apply the changes in `./patches` folder after each `npm install`.

The need for patching is because the path to `tsconfig.json` has been
[hardcoded](https://github.com/facebook/create-react-app/blob/v4.0.3/packages/react-scripts/config/paths.js#L71) in
`react-scripts` (current latest version is 4.0.3).

Without patching, the setup with `tsconfig.json` for frontend, and `tsconfig.backend.json` for backend is still possible
and the codes would compile correctly. Hovever, text editors tend to pickup only `tsconfig.json` (which on applies for
the frontend code, and does not work correctly when editing backend folder). Setting up custom `tsconfig.<custom>.json`
path for editor's TypeScript hinting turns out to be more tedious than it should be. There is a
[long pending issue](https://github.com/microsoft/vscode/issues/12463) for vscode for example, nor there is such option
in [Emacs Tide](https://github.com/ananthakumaran/tide)
