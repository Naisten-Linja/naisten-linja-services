# Naisten Linja Services

This is the code for Naisten Linja's services including:

- [x] User authentication via Discourse SSO at [ryhmat.naistenlinja.fi](https://ryhmat.naistenlinja.fi)
- [ ] Volunteer bookings management
- [x] Online letter API
- [x] Admin interface for staff and volunteer to answer to online letters

## Production environment

|         |                                  |
|---------|----------------------------------|
| URL     | https://services.naistenlinja.fi |
| Hosting | Heroku                           |
| DNS     | Cloudflare                       |

## Development

### Prerequisites

Project requires Node.js version 14. Our dependencies are installed and managed via npm, and are defined in package.json

To help managing node versions easily, we recommend using a node package manager like [nvm](https://github.com/nvm-sh/nvm).

We are also using [direnv](https://direnv.net/) to automatically set environment variables as you switch directories.

### Development environment setup

First clone the project from GitHub.

```shell
git clone git@github.com:Naisten-Linja/naisten-linja-services.git
```

After that, these follow steps assume you are using nvm as the Node.js package manager.

```shell
cd naisten-linja-services
# install dependencies
npm i
```

### Environment variables

The following steps assume that you are using [direnv](https://direnv.net/). Also remember to hook direnv into your preferred shell environment as described [here](https://direnv.net/docs/hook.html) if that is not done before.

Copy over .envrc.example into .envrc, at the project root. Ask an existing team member to provide you with the `DISCOURSE_URL` and `DISCOURSE_SSO_SECRET`. You would also need to have an admin account created in `ryhmat.naistenlinja.fi` in order to login to the service.

```shell
cp .envrc.example .envrc

# approve the change of environment variables
direnv allow
```

If `direnv` hook is setup correctly, after making a change to the variables in `.envrc` file, `direnv` will request you to run `direnv allow` for the new set of variables to take effect.

Also remember to update `.envrc.example` when removing, or introducing a new variable.


### Database setup

First, make sure there is no other Postgres instance running locally, or using port 5432.

Quickly start a Postgres database in docker with

```
docker run --name naisten_linja_db -e POSTGRES_USER=nl_dev -e POSTGRES_PASSWORD=nl_dev -e POSTGRES_DB=nl_dev -v "/$(pwd)/db-data:/var/lib/postgresql/data" -p 5432:5432 postgres:11.9
```

Upon the first time, this will create a new container named `naisten_linja_db` with the credentials matching the default environment variables set in `.envrc` file.

Run migrations:

```
npm run db-migrate up all
```

### Start the development environment

Once the database and environment variables are setup, run

```
npm run dev
```

This will start both the frontend and backend development environment. The development service should be accessible at http://localhost:3000
