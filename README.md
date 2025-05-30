# Homepage

[![license: GPLv3](https://img.shields.io/badge/license-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub release](https://img.shields.io/github/release/nioc/homepage.svg)](https://github.com/nioc/homepage/releases/latest)
[![GitHub Docker workflow status](https://img.shields.io/github/actions/workflow/status/nioc/homepage/release.yml?label=github%20build)](https://github.com/nioc/homepage/actions/workflows/release.yml)
[![GitHub downloads](https://img.shields.io/github/downloads/nioc/homepage/total?label=github%20downloads)](https://github.com/nioc/homepage/releases/latest)
[![Docker Pulls](https://img.shields.io/docker/pulls/nioc/homepage)](https://hub.docker.com/r/nioc/homepage/tags)
[![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/nioc/homepage?sort=date)](https://hub.docker.com/r/nioc/homepage/tags)

Light, simple but attractive and customizable home page to your favorite services

## Features

- simple configuration with YAML files and GUI (no backend required)
- use _Trusted Header SSO_ like those provided by [Authelia](https://www.authelia.com/integration/trusted-header-sso/introduction/): the links displayed can be configured for each group (LDAP) and user
- links grouped by topic (system admin, communication, etc.)
- search for a link by name or tags
- displays link icon either:
  - via the [Simple Icons](https://simpleicons.org/) list (colored icon)
  - via the [Pictogrammers Material Design Icons](https://pictogrammers.com/library/mdi/) list (monochromatic icon)
  - or via a link-specific url
- handle user preference for light or dark mode (`prefers-color-scheme`)
- nice background using [Trianglify](https://github.com/qrohlf/trianglify) (requires additional JS file to be loaded)
- responsive
- easily customizable by supplying an additional css file
- lightweight (100 Kb ungzipped without Trianglify, 40 kb gzipped) and tiny server memory footprint (< 10 Mb)

![Screenshot](/screenshots/basic.png "Screenshot with tags ans search")

## Installation

_Note: As this application doesn't handle https, you'll need to expose it behind a reverse proxy (HAProxy, Traefik, Caddy, etc.) to secure the data flow._

### From docker image

Example of a `docker-compose.yml` file, exposing homepage on port 8080 with provided YAML files (in `/conf` folder):
```yaml
services:
  homepage:
    image: nioc/homepage:latest
    restart: always
    ports:
    - "8080:80"
    volumes:
    - ./conf:/usr/share/nginx/html/conf:ro
    # - ./default.conf.template:/etc/nginx/templates/default.conf.template:ro
    # - ./files:/usr/share/nginx/html/files
    environment:
    - NGINX_HOST=apps.mydomain
    # - NGINX_PORT=80 #default
    # - NGINX_GZIP=off #default
    # - NGINX_SSO_GROUPS_HEADER_NAME=Remote_Groups #default
    # - NGINX_SSO_USER_HEADER_NAME=Remote_User #default
    # - NGINX_RESOLVER=127.0.0.11 #default
    # - NGINX_FETCH_FILE_METHOD=off #default, set PUT for uploading external icons
```

### Within an Nginx container

Unzip files from the archive into a directory (`/home/myuser/homepage` for example), you should have:
- Nginx configuration file: `default.conf.template`
- builded app folder: `homepage-app`

Create a `conf` folder

Example of a `docker-compose.yml` file:
```yaml
version: "3.4"
services:
  homepage:
    image: nginx:stable-alpine
    restart: always
    ports:
    - "8080:80"
    volumes:
      - /home/myuser/homepage/default.conf.template:/etc/nginx/templates/default.conf.template:ro
      - /home/myuser/homepage/homepage-app:/usr/share/nginx/html/app:ro
      - /home/myuser/homepage/conf:/usr/share/nginx/html/conf:ro
      # - /home/myuser/homepage/files:/usr/share/nginx/html/files
    environment:
    - NGINX_HOST=apps.mydomain
    - NGINX_PORT=80
    - NGINX_GZIP=off
    - NGINX_SSO_GROUPS_HEADER_NAME=Remote_Groups
    - NGINX_SSO_USER_HEADER_NAME=Remote_User
    - NGINX_RESOLVER=9.9.9.9
    - NGINX_FETCH_FILE_METHOD=PUT
```

### With an existing web server

Unzip the `homepage-app` folder from the archive into the server's root directory, then, create a `conf` folder ; **some features may not work**.

## Configuration

### Base

Create an `app.yml` file (in `conf` folder) with your content, you can copy the [dist file](public/conf/app.yml.dist).

Here is a commented example:

```yaml
title: Homepage # optional title overwriting 
# customCssUrl: files/custom.css # optionnal additionnal CSS file
displayTitle: true # optionnal, display title in page
displaySearch: true # optionnal, display search field for filtering links
displayTags: false # optionnal, display associated tags for each link
# backgroundImage: /files/background.png # optionnal custom background image, can be served from /files folder
trianglifySeed: myseed # optionnal (activate Trianglify)
groupsAdditionalFiles: # leave it blank, it will be filled by the SSO mechanism
groupsAdditionalFilesPattern: ^(dev|admin)$
userAdditionalFile: # leave it blank, it will be filled by the SSO mechanism

topics: # list of topics
- name: System # displayed topic name
  order: 1 # optionnal, topic sorting order
  links: # list of links for this topic
  - name: Portainer
    order: 1 # optionnal, link sorting order
    icon: portainer
    # iconUrl: files/portainer.svg # optionnal, replace icon attribute with a custom icon, can be served from /files folder
    href: https://localhost:9443
    tags: # optionnal tags list (for search and display)
    - docker
    - container
    target: portainer # optionnal, specifies where to open the link (default: _blank)
```

For icon, use [material design name](https://pictogrammers.com/library/mdi/) or [simple icons slug](https://simpleicons.org/)

### Using SSO

If you use an SSO system, you can use it to identify the logged-in user and his or her groups.

In this case, set the environment variables: `NGINX_SSO_GROUPS_HEADER_NAME` (for Authelia: `Remote_Groups`) and `NGINX_SSO_USER_HEADER_NAME` (for Authelia: `Remote_User`) and create associated YAML files:
- For a basic home server with 2 users (example: John and Mary): `conf/john.yml` and `conf/mary.yml`
- For more complex organization, use groups  (example: admin and dev): `conf/dev.yml` and `conf/admin.yml`

### Configuration GUI

A graphical configuration page can be accessed by adding `?config` to the url.

This allows you to simply add a link via a form (generating the YAML ready to add to the file).

#### Use of page metadata

In order to retrieve the web page's metadata (title and icon), it is necessary to value a valid DNS resolver via the variable `NGINX_RESOLVER` (with `9.9.9.9` for example), by default, it uses the docker internal resolver (`127.0.0.11`).

#### External icons persistence

In order to persist downloaded icons, a folder belonging to Nginx group (`101`) must be created and mounted on `/usr/share/nginx/html/files`.

In order to persist the icon directly from the GUI, it is also necessary to value the `NGINX_FETCH_FILE_METHOD` variable with `PUT`.

Please note that using proxy and file upload functions **can damage your filesystem**, so only use them in a secure environment (behind an SSO-authenticated reverse proxy, with basic auth, etc.).

### Advanced styling

Add a CSS file to your webserver folder (for example `files/custom.css`) with yours changes

Here an example which change the main color and reduce the font size:

```css
@charset "UTF-8";
html {
    font-size: 10px;
    --hp-hue: 120!important;
}
```

Set the filename in app.yml: `customCssUrl: files/custom.css`

## Versioning

This homepage is maintained under the [semantic versioning](https://semver.org/) guidelines.

See the [releases](https://github.com/nioc/homepage/releases) on this repository for changelog.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE.md) file for details
