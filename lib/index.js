/*jslint node: true */
"use strict";

var DocumentDBProvider = function(){

	var DocumentDBClient = require('documentdb').DocumentClient;

	var host = process.env.ENTRYWAY_DOCUMENTDB_HOST_URL;
	var _collectionUri = 'dbs/' + process.env.ENTRYWAY_DOCUMENTDB_DB + '/colls/' + process.env.ENTRYWAY_DOCUMENTDB_COLLECTION;
	var _client = new DocumentDBClient(host, {masterKey: process.env.ENTRYWAY_DOCUMENTDB_MASTER_KEY}); 	

	var bcryptjs = require('bcryptjs');
	var uuid = require('uuid');


	var _create = function(user, cb){
		_validateNewUser(user, function(err, validation){
			if (err) return cb(err, null);
			_client.createDocument(_collectionUri, user, function(err2, data){
				if (err2) return cb(err2, null);				
				for (var s in data[0]){
					user[s] = data[0][s];
				}
				return cb(null, true);
			});
		});		
	},

	_findByUserHandle = function(userHandle, tenant, cb){
		var tenantValue = tenant;
		if (tenant === undefined) tenantValue = undefined;
		var querySpec = {
			query: 'SELECT * FROM u WHERE u.userHandle = @userHandle AND u.tenant = @tenant AND u.docType = "USER"',
			parameters: [
				{name: '@userHandle', value: userHandle},
				{name: '@tenant', value: tenantValue}
			]
		};
		if (tenant === undefined){
			querySpec.query = 'SELECT * FROM u WHERE u.userHandle = @userHandle AND NOT IS_DEFINED(u.tenant) AND u.docType = "USER"';
			querySpec.parameters = [{name: '@userHandle', value: userHandle}];
		}

		_client.queryDocuments(_collectionUri, querySpec).toArray(function(err, results){
			if (err) return cb(err, null);
			return cb(null, results[0]);
		});
	},

	_getById = function(id, user, cb){
		var querySpec = {
			query: 'SELECT * FROM u WHERE u.id = @id AND u.docType = "USER"',
			parameters: [{name: '@id', value: id}]
		};

		_client.queryDocuments(_collectionUri, querySpec).toArray(function(err, results){
			if (err) return cb(err, null);
			if (results[0] !== undefined){
				for (var s in results[0]){
					if (s !== 'provider'){
						user[s] = results[0][s];				
					}
				}				
			}
			return cb(null, true);
		});		
	},

	_getByStrategy = function(strategyType, strategyId, tenant, user, cb){
		_getByStrategyPrivate(strategyType, strategyId, tenant, function(err, userData){
			if (err) return cb(err, null);
			if (userData !== undefined){
				_getById(userData.id, user, cb);
				/*for (var s in userData){
					user[s] = userData[s];
				}
				*/				
			}
			else{
				return cb(null, true);			
			}
		});		
	},

	_getByStrategyPrivate = function(strategyType, strategyId, tenant, cb){
		var querySpec = {
			query: 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = @strategyType AND s.id = @strategyId AND NOT IS_DEFINED(u.tenant) AND u.docType = "USER"',
			parameters: [
				{name: '@strategyType', value: strategyType},
				{name: '@strategyId', value: strategyId}
			]
		};

		if (tenant !== ''){
			querySpec.query = 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = @strategyType AND s.id = @strategyId AND u.tenant = @tenant AND u.docType = "USER"';
			querySpec.parameters.push({name: '@tenant', value: tenant});
		}
		_client.queryDocuments(_collectionUri, querySpec).toArray(function(err, results){
			if (err) return cb(err, null);
			return cb(null, results[0]);			
		});		
	},

	_isStrategyInUse = function(strategyType, strategyID, tenant, cb){
		_getByStrategyPrivate(strategyType, strategyID, tenant, function(err, strategyMatch){
			if (err) return cb(err, null);
			if (strategyMatch === undefined){
				return cb(null, false);
			}
			else{
				return cb(new Error('This strategy is already in use'), null);
			}
		});
	},

	_passwordLogin = function(userHandle, password, tenant, user, cb){
		var querySpec = {
			query: 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = "LOCAL" AND s.id = @userHandle AND NOT IS_DEFINED(u.tenant) AND u.docType = "USER"',
			parameters: [
				{name: '@userHandle', value: userHandle}
			]
		};
		if (tenant !== ''){
			querySpec.query = 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = "LOCAL" AND s.id = @userHandle AND u.tenant = @tenant AND u.docType = "USER"';
			querySpec.parameters = [
				{name: '@userHandle', value: userHandle},
				{name: '@tenant', value: tenant}
			];
		}
		_client.queryDocuments(_collectionUri, querySpec).toArray(function(err, results){
			if (err) return cb(err, null);
			if (results[0] !== undefined){
				if (bcryptjs.compareSync(password, results[0].token)){
					_getById(results[0].id, user, cb);
				}
				else{
					return cb(null, false);			
				}
			}
			else{
				return cb(null, false);			
			}
		});		
	},

	_remove = function(user, cb){
		_client.deleteDocument(user._self, function(err, data){
			if (err) return cb(err);
			user.init();
			return cb(null, true);
		});		
	},

	_strategyLogin = function(userHandle, strategyType, accessToken, tenant, user, cb){
		var querySpec = {
			query: 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = @strategyType AND s.id = @userHandle AND NOT IS_DEFINED(u.tenant) AND u.docType = "USER"',
			parameters: [
				{name: '@userHandle', value: userHandle},
				{name: '@strategyType', value: strategyType}
			]
		};

		if (tenant !== ''){
			querySpec.query = 'SELECT u.id, u.displayName, s.type, s.id sid, s.token FROM u JOIN s IN u.strategies WHERE s.type = @strategyType AND s.id = @userHandle AND u.tenant = @tenant AND u.docType = "USER"';
			querySpec.parameters.push({name: '@tenant', value: tenant});
		}

		_client.queryDocuments(_collectionUri, querySpec).toArray(function(err, results){
			if (err) return cb(err, null);

			if (results[0] !== undefined){
				if (results[0].token !== accessToken){
					// need to update token
					_getById(results[0].id, user, function(err2, results){
						if (err2) return cb(err2, null);
						for (var x=0;x<user.strategies.length;x++){
							if (user.strategies[x].type === strategyType){
								user.strategies[x].token = accessToken;
							}
						}
						user.save(cb);
					});
				}
				else{
					_getById(results[0].id, user, cb);
				}
			}
			else{
				return cb(null, false);			
			}
		});				
	},

	_update = function(user, cb){
		_client.replaceDocument(user._self, user, cb);		
	},

	_validateAddingNewStrategy = function(strategyType, userHandle, user, cb){
		if (user.strategies.length > 0 && user.id === '') return cb(new Error('An unpersisted user cannot have more than one strategy'), null);
		for (var x=0;x<user.strategies.length;x++){
			if (user.strategies[x].type === strategyType){
				return cb(new Error('A user cannot have two strategies of the same type'), null);
			}
		}
		_isStrategyInUse(strategyType, userHandle, user.tenant, function(err, results){
			if (err) return cb(err, null);
			return cb(null, true);
		});
	},

	_validateNewUser = function(user, cb){
		_validateSchema(user, function(err, validation){
			if (err) return cb(err, null);

			if (user.strategies.length > 1){
				return cb(new Error('New users can only have one strategy'), null);
			}
			_findByUserHandle(user.userHandle, user.tenant, function(err, results){
				if (err) return cb(err, null);

				if (results === undefined){
					_isStrategyInUse(user.strategies[0].type, user.strategies[0].id, user.tenant, function(errStrategyInUse, strategyMatch){
						if (errStrategyInUse) return cb(errStrategyInUse, null);
						return cb(null, true);
					});
				}
				else{
					return cb(new Error('User exists already with this user handle'), null);
				}
			});
		});		
	},

	_validateSchema = function(user, cb){
		if (user.docType === undefined){
			user.docType = 'USER';
			//return cb(new Error('docType property has been removed, it is required'), null);
		}
		if (user.userHandle === undefined) return cb(new Error('userHandle property has been removed, it is required'), null);
		if (user.userHandle === '') return cb(new Error('userHandle must have a value'), null);

		if (user.strategies === undefined) return cb(new Error('strategies collection has been removed, it is required'), null);
		if (user.strategies.length === 0) return cb(new Error('At least one strategy is required'), null);

		//if (user.tenant === undefined) return cb(new Error('tenant property has been removed, it is required'), null);
		return cb(null, true);
	};





	return {
		create: _create,
		getById: _getById,
		getByStrategy: _getByStrategy, 
		passwordLogin: _passwordLogin,
		remove: _remove,
		strategyLogin: _strategyLogin,
		update: _update,
		validateAddingNewStrategy: _validateAddingNewStrategy
	};
}();
module.exports = DocumentDBProvider;


