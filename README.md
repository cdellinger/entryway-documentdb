# Entryway-DocumentDB

This project provides a node module that allows you to persist user data to [Microsoft Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) via the [Entryway](https://github.com/cdellinger/entryway) authentication module.

##Installation
###Core Module

After installing [Entryway](https://github.com/cdellinger/entryway), this module can be installed as follows: 

    npm install entryway-documentdb


##Usage

In order to use this project, you need to first [create a DocumentDB account](http://azure.microsoft.com/en-us/documentation/articles/documentdb-create-account/).

##Configuration
You must provide four configuration values as environmental variables in order for this project to work successfully.  These four values are as follows

	ENTRYWAY_DOCUMENTDB_HOST_URL
	ENTRYWAY_DOCUMENTDB_DB
	ENTRYWAY_DOCUMENTDB_COLLECTION
	ENTRYWAY_DOCUMENTDB_MASTER_KEY

###ENTRYWAY_DOCUMENTDB_HOST_URL
This is the https endpoint provided by Azure when you set up your DocumentDB account.  It will be something similar to the following:
	https://YOUR_HOST_NAME.documents.azure.com:443/

###ENTRYWAY_DOCUMENTDB_DB
This is the database name that you create when you set up your account.

###ENTRYWAY_DOCUMENTDB_COLLECTION
This is the name of the collection you create within the database from above where you want Entryway to persist its data.

###ENTRYWAY_DOCUMENTDB_MASTER_KEY
This is the value of the Primary Key that is created when you create your DocumentDB database.