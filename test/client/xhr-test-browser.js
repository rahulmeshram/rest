/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, failOnThrow;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;
	failOnThrow = buster.assertions.failOnThrow;

	define('rest/client/xhr-test', function (require) {

		var xhr, rest, xhrFallback, when, client;

		xhr = require('rest/client/xhr');
		rest = require('rest');
		xhrFallback = require('rest/interceptor/ie/xhr');
		when = require('when');

		// use xhrFallback when XHR is not native
		client = !XMLHttpRequest ? xhr.chain(xhrFallback) : xhr;

		buster.testCase('rest/client/xhr', {
			'should make a GET by default': function () {
				var request = { path: '/' };
				return client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make an explicit GET': function () {
				var request = { path: '/', method: 'GET' };
				return client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make a POST with an entity': function () {
				var request = { path: '/', entity: 'hello world' };
				return client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make an explicit POST with an entity': function () {
				var request = { path: '/', entity: 'hello world', method: 'POST' };
				return client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should abort the request if canceled': function (done) {
				// TDOO find an endpoint that takes a bit to respond, cached files may return synchronously
				var request = { path: '/wait/' + new Date().getTime() };
				when.all([
					client(request).then(
						fail,
						failOnThrow(function (response) {
							assert(request.canceled);
							try {
								// accessing 'status' will throw in older Firefox
								assert.same(0, response.raw.status);
							}
							catch (e) {
								// ignore
							}

							// this assertion is true in every browser except for IE 6
							// assert.same(XMLHttpRequest.UNSENT || 0, response.raw.readyState);
							assert(response.raw.readyState <= 3);
						})
					),
					when({}, function () {
						// push into when's nextTick resolution
						refute(request.canceled);
						request.cancel();
					})
				]).always(done);
			},
			'//should propogate request errors': function () {
				// TODO follow up with Sauce Labs
				// this test is valid, but fails with sauce as their proxy returns a 400
				var request = { path: 'http://localhost:1234' };
				return client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same('loaderror', response.error);
					})
				);
			},
			'should not make a request that has already been canceled': function () {
				var request = { canceled: true, path: '/' };
				return client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same(request, response.request);
						assert(request.canceled);
						assert.same('precanceled', response.error);
					})
				);
			},
			'should reject if an XHR impl is not available': {
				requiresSupportFor: { 'no-xhr': !window.XMLHttpRequest },
				'': function () {
					var request = { path: '/' };
					return xhr(request).then(
						fail,
						failOnThrow(function (response) {
							assert.same(request, response.request);
							assert.same('xhr-not-available', response.error);
						})
					);
				}
			},
			'should be the default client': function () {
				assert.same(xhr, rest);
			},
			'should support interceptor chaining': function () {
				assert(typeof xhr.chain === 'function');
			}
		});
		// TODO spy XmlHttpRequest

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
