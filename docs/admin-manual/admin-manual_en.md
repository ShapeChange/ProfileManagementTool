# PMT Admin Manual

## Installation

To install the *PMT* on Windows Server 2008/2012 R2, follow the steps below.

### Prerequisites

*PMT* requires version 6.x of *Node.js* and version 3.4.x of *MongoDB*. These instructions assume that *MongoDB* is installed on the same server as *PMT*. You may as well install *MongoDB* e.g. on a separate Linux server and adjust the *MongoDB* Connection URI in the configuration.

#### Install MongoDB

1. Download the latest stable release of MongoDB Community Server for Windows Server 2008 R2 64-bit and later with SSL from here: https://www.mongodb.com/download-center?jmp=nav#community
2. Follow these instructions to install MongoDB for Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/#install-mongodb-community-edition
3. After the installation, follow these instructions to create a Windows Service for MongoDB: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/#configure-a-windows-service-for-mongodb-community-edition
4. Optionally, to enable authentication follow these instructions: https://docs.mongodb.com/manual/tutorial/enable-authentication/
  If you do that, make sure to create a database and an according user with write access for the *PMT*. After installing the latter, you would have to change the MongoDB Connection URI accordingly, see https://github.com/ShapeChange/ProfileManagementTool/wiki/Configuration.

#### Install Node.js

1. Download the latest LTS version of the 64-bit Windows Installer for Node.js from here: https://nodejs.org/en/download/
2. Execute the installer with the default settings and follow the instructions.
3. To verify the installation, open a command prompt and run "node -v". That should print the installed Node.js version.

### PMT

#### Installation

1. Download the latest release (`pmt-win-1.0.0.zip` and `pmt-{release}.tgz`) from here: https://github.com/ShapeChange/ProfileManagementTool/releases/latest
2. Unzip `pmt-win-1.0.0.zip` to a directory of your choice, e.g. `C:\Program Files\pmt`. This file contains a wrapper for the application to run it as a windows service.
3. Copy `pmt-{release}.tgz` to the installation directory.
4. Open a command prompt with administrative rights and go to the installation directory, e.g. `C:\Program Files\pmt`.
5. Run the command `npm install pmt-{release}.tgz` to install the application itself. It will automatically be registered as a windows service. 
6. Open http://localhost in a web browser if the browser is running on the same machine, or the respective hostname otherwise. 

#### Upgrade

1. Download the latest release (`pmt-{release}.tgz`) from https://github.com/ShapeChange/ProfileManagementTool/releases/latest and copy it to the installation directory.
2. Run the command `npm install pmt-{release}.tgz` to upgrade the application. The windows service will automatically be stopped before upgrading and started again when the upgrade is complete.

## Configuration

If you want to change the *PMT* configuration, open the file `config.js` in the installation folder and set the values you want to overwrite. To apply the new settings, you have to restart the *PMT* windows service.

The default configuration looks like this:

```
{
    "server": {
        "port": 80
    },
    "db": {
        "url": "mongodb://localhost/pmt01"
    },
    "app": {
      "geometry": ["P", "C", "S", "So", "MP", "MC", "MS", "MSo"]
    }
}
```

### Web Server Port

If you want the *PMT* server to listen on a different port than 80, change the setting of `server.port` in the configuration file.

### MongoDB URI

If the MongoDB instance that the *PMT* should use is running on a different machine, on a non-default port or uses authentication, you can change the setting of `db.url` in the configuration file.

The value needs to be a valid MongoDB Connection String URI, see https://docs.mongodb.com/manual/reference/connection-string/. 

### Application settings

If you want to change the allowed geometries for *featuretype*s, you can change the setting of `app.geometry` in the configuration file.