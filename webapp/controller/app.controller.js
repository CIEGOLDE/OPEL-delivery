sap.ui.define(["./BaseController",
	"./designMode",
	"sap/ui/model/json/JSONModel"
], function (BaseController, designMode, JSONModel) {
	"use strict";
	return BaseController.extend("cie.delivery.controller.app", {
		onInit: function () {
			this.getView().addStyleClass(designMode.getCompactCozyClass());
		}
	});
});