sap.ui.define(
	["./BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"./messages",
		"./designMode"
	],
	function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, messages, designMode) {
		"use strict";

		return BaseController.extend("cie.delivery.controller.deliverymain", {

			onInit: function () {
				this._JSONModel = this.getModel();
				var device = {
					computer: true,
					phone: false
				};
				if (designMode.getCompactCozyClass() === "sapUiSizeCozy") {
					device.computer = false;
					device.phone = true;
					this._JSONModel.setProperty("/device", device, false);
				}
				if (designMode.getCompactCozyClass() === "sapUiSizeCompact") {
					this._JSONModel.setProperty("/device", device, false);
				}
				//this.initDateRange();
				this.getInitData();
			},
			// initDateRange: function () {
			// 	var date = new Date();
			// 	this.byId("ReservationDate").setTo(date);
			// 	var year = date.getFullYear();
			// 	var nowMonth = date.getMonth() + 1;
			// 	nowMonth = (nowMonth < 10 ? "0" + nowMonth : nowMonth);
			// 	var dateStr = year.toString() + '-' + nowMonth.toString() + '-' + '01';
			// 	this.byId("ReservationDate").setFrom(new Date(dateStr));
			// },
			// Init Data
			getInitData: function () {
				// var reservationItem = {
				// 	ReservationItem: "",
				// 	Product: "",
				// 	ProductDescription: "",
				// 	StorageLocation: "",
				// 	ResvnItmRequiredQtyInEntryUnit: "",
				// 	BaseUnit: "",
				// 	Batch: "",
				// 	ReservationItemText: "",
				// 	Plant: "",
				// 	IssuingOrReceivingStorageLoc: "",
				// 	Reservation: "",
				// 	ReservationDate: "",
				// 	GoodsMovementType: "",
				// 	OrderID: ""
				// };
				var delivery = {
					DeliveryDocument: "",
					ShipToParty: "",
					HeaderNetWeight: ""

				};
				var deliverySet = [];
				this._JSONModel.setProperty("/delivery", delivery);
				this._JSONModel.setProperty("/deliverySet", deliverySet);
			},
			//	onAfterRendering: function() {
			//
			//	},
			onSearch: function () {
				this.byId("table").setBusy(true);
				this._JSONModel.setProperty("/deliverySet", []);
				var sUrl = "/A_OutbDeliveryHeader?$expand=to_DeliveryDocumentItem/to_DeliveryDocumentItemText";
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV;v=0002";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				//var ReservationDate = this.byId("ReservationDate").getValue();
				var delivery = this.byId("DeliveryDocument").getValue();
				// if (ReservationDate) {
				// 	var reservationDateArr = ReservationDate.split(" ");
				// 	var filterParameter = "(ReservationDate ge datetime'" + reservationDateArr[0] + "T00:00:00' and ReservationDate le datetime'" +
				// 		reservationDateArr[2] + "T00:00:00')";
				// }
				var filterParameter = "";
				filterParameter = "ShipToParty eq '1000003'";
				if (delivery) {
					// if (filterParameter) {
					filterParameter += " and DeliveryDocument eq '" + delivery + "'";
					// } else {
					// 	filterParameter = "Reservation eq'" + Reservation + "'";
					// }
					// }else{ filterParameter = "";
				}
				var mUrlParameter = {
					"$filter": filterParameter
				};
				var mParameters = {
					urlParameters: mUrlParameter,
					success: function (oData, response) {
						this.byId("table").setBusy(false);
						var Arry = oData.results;
						if (Arry.length > 0) {
							// 	this.processdelivery(Arry);
							this._JSONModel.setProperty("/deliveryitemSet", Arry);
							this.getdisplaydata(Arry);
						} else {
							messages.showText("No Data!");
						}
					}.bind(this),
					error: function (oError) {
						this.byId("table").setBusy(false);
						messages.showODataErrorText(oError);
					}.bind(this)
				};
				ODataModel.read(sUrl, mParameters);
			},
			getdisplaydata: function (Arry) {
				var i = 0;
				var j = 0;
				var delivery = [];
				for (i = 0; i < Arry.length; i++) {
					for (j = 0; j < Arry[i].to_DeliveryDocumentItem.results.length; j++) {
						if (Arry[i].to_DeliveryDocumentItem.results[j].HigherLvlItmOfBatSpltItm != '000000') {
							var header = [];
							header.DeliveryDocument = Arry[i].DeliveryDocument;
							header.ShipToParty = Arry[i].ShipToParty;
							header.HeaderNetWeight = Arry[i].HeaderNetWeight;
							delivery.push(header);
						}
					}
				}
				for (i = delivery.length - 1; i > 0; i--) {
					if (delivery[i - 1].DeliveryDocument === delivery[i].DeliveryDocument) {
						delivery.splice(i, 1);
					}
				}
				this._JSONModel.setProperty("/deliverySet", delivery);
			},

			// Print Form
			onPrint: function (oEvent) {
				// var oRequest = "";
				// var sUrl = "https://ciedev.erik.top:8443/api/Service/339F34A9BFAC50A1/Print"; // /api/Service/339F34A9BFAC50A1/Print
				var sUrl = "https://ciedev.erik.top:8443/api/Service/339F34A9BFAC50A1/Push/";
				var deliverySet = this._JSONModel.getData().deliverySet; //
				var deliveryitemSet = this._JSONModel.getData().deliveryitemSet;
				var ItemTable = this.getView().byId("table");
				var selectIndexArry = ItemTable.getSelectedIndices();
				var selectItemArr = [];
				var ditem = [];
				var item1 = [];
				var messageText = "";
				if (selectIndexArry.length <= 0) {
					sap.m.MessageBox.warning("Please select at least one line", {
						title: "Tips"
					});
					this.setBusy(false);
					return;
				} else {
					//call zpl print
					//selectItemArr = this._JSONModel.getData().deliverySet;//oData.results[0].
					for (var i = 0; i < selectIndexArry.length; i++) {
						//this._JSONModel.setProperty("/reservationItemsSet/" + i + "/ProductDescription", oData.results[0].ProductDescription);
						var j = selectIndexArry[i];
						//selectItemArr[i] =  deliverySet[j].to_DeliveryDocumentItem.result; //需要打印的数据
						//var item = deliverySet[j].to_DeliveryDocumentItem; 
						selectItemArr[i] = deliverySet[j];
						for (var k = 0; k < deliveryitemSet.length; k++) {
							if (deliveryitemSet[k].DeliveryDocument === deliverySet[j].DeliveryDocument) {
								for (var l = 0; l < deliveryitemSet[k].to_DeliveryDocumentItem.results.length; l++) {
									var item = deliveryitemSet[k].to_DeliveryDocumentItem.results[l];
									item1.push(item);
									if (deliveryitemSet[k].to_DeliveryDocumentItem.results[l].HigherLvlItmOfBatSpltItm != '000000') {
										ditem.push(item);
									}
								}
								break;
							}
						}
					}
					if (ditem.length === 0) {
						this.setBusy(false);
						messageText = "No data to print"; //that._ResourceBundle.getText("infoMsg1",[sBatch]);
						sap.m.MessageBox.warning(messageText, {
							title: "Tips"
						});
					} else {
						var currentnum = 0;
						var sumnum = ditem.length;
						for (i = 0; i < ditem.length; i++) {
							// if (ditem[i].HigherLvlItmOfBatSpltItm != '000000') {
							// printArr.push({
							// 	Name: "PlaceofDischarge",
							// 	Value: ditem[i].yy1_PlaceofDischarge_dli
							// });
							var printArr = [];
							var printArr2 = [];
							for (j = 0; j < item1.length; j++) {
								if (ditem[i].DeliveryDocument === item1[j].DeliveryDocument && ditem[i].HigherLvlItmOfBatSpltItm === item1[j].DeliveryDocumentItem) {
									var ShipTo = item1[j].YY1_ShipTo_DLI + " " + item1[j].YY1_PlaceofDischarge_DLI;
									printArr.push({
										Name: "ShipTo",
										Value: ShipTo
									});
									printArr.push({
										Name: "MaterialHandlingCo",
										Value: "SBM1"
											// Value: item1[j].YY1_MaterialHandlingCo_DLI
									});
								}
							}
							printArr.push({
								Name: " MaterialByCustomer",
								Value: ditem[i].MaterialByCustomer
							});
							printArr.push({
								Name: "Batch",
								Value: ditem[i].Batch
							});
							printArr.push({
								Name: "PlateBatch",
								Value: 'UN545301053' + ditem[i].Batch
							});

							printArr.push({
								Name: "Material",
								Value: ditem[i].Material
							});
							printArr.push({
								Name: "DeliveryDocument",
								Value: ditem[i].DeliveryDocument
							});

							if (ditem[i].ManufactureDate != null) {
								var zdate = ditem[i].ManufactureDate.substr(0, 10);
								zdate = zdate.replace(/-/g,"");
								var date1 = new Date(ditem[i].ManufactureDate.substr(0, 10)); //new Date("2019-11-13");
								var date = date1.toDateString();
								var datearr = date.split(" ");
								var ManufactureDate = datearr[2] + datearr[1] + " " + datearr[3]; //日月年 13NOV2019
							}
							printArr.push({
								Name: "ManufactureDate",
								Value: ManufactureDate
							});
							var Headergrossweight = "155" ; //parseInt(ditem[i].ItemNetWeight,10)  + 30;
							printArr.push({
								Name: "Headergrossweight",
								Value: Headergrossweight
							});

							// for (j = 0; j < selectItemArr.length; j++) {
							// 	if (selectItemArr[j].DeliveryDocument === ditem[i].DeliveryDocument) {
							// 		var Headergrossweight = selectItemArr[j].HeaderNetWeight;
							// 		break;
							// 	}
							// }
							for (j = 0; j < ditem[i].to_DeliveryDocumentItemText.results.length; j++) {
								if (ditem[i].to_DeliveryDocumentItemText.results[j].TextElementDescription === "Shipping Instrns from Cust.") {
									var itemtext = ditem[i].to_DeliveryDocumentItemText.results[j].TextElementText.split(";");
									for (k = 0; k < itemtext.length; k++) {
										var temp = itemtext[k].split(":");
										if (temp[0] === "Kanban") {
											var KANBANNumber = temp[1];
										} else if (temp[0] === "PackType") {
											var TypeofPackages = temp[1];
										} else if (temp[0] === "QtyPerPack") {
											var QTYPerPack = temp[1];
										}
									}
									KANBANNumber = "QB20";
									printArr.push({
										Name: "KANBANNumber",
										Value: KANBANNumber
									});
									printArr.push({
										Name: "TypeofPackages",
										Value: TypeofPackages
									});
									printArr.push({
										Name: "QTYPerPack",
										Value: QTYPerPack
									});
									// Headergrossweight = Headergrossweight + ditem[i].ActualDeliveryQuantity / QTYPerPack * 30;
									// printArr.push({
									// 	Name: "Headergrossweight",
									// 	Value: Headergrossweight
									// });
									break;
								}
							}
							printArr.push({
								Name: "A3_barcode_2D",
								// Value: "[)>~3006~029P" + ditem[i].MaterialByCustomer + "~029Q" + QTYPerPack + "~0291JUN545301053" + ditem[i].Batch + "~02920L" +
								// 	ditem[i].MaterialHandlingCo + "~02921L" + ShipTo + "~02915K" + KANBANNumber + "~029B" + TypeofPackages + "~0297Q" +
								// 	Headergrossweight + "GT~0292S" + ditem[i].DeliveryDocument + "~030_04" 
								Value: "[)>_1E06_1DP" + ditem[i].MaterialByCustomer + "_1DQ" + QTYPerPack + "_1D1JUN545301053" + ditem[i].Batch + "_1D20L" +
									"SBM1" + "_1D21L" + ShipTo + "_1D15K" + KANBANNumber + "_1DB" + TypeofPackages + "_1D7Q" +
									Headergrossweight + "GT_1D2S" + ditem[i].DeliveryDocument + "_1D" + "16D" + zdate + "_1E_04" // "_1D" + 16D20190811+"_1E_04"
							});
							printArr.push({
								Name: "D1_barcode",
								Value: "1JUN545301053" + ditem[i].Batch
							});
							printArr.push({
								Name: "E1_barcode",
								Value: "3S" + ditem[i].Batch
							});
							printArr.push({
								Name: "E1_QRcode",
								Value: "[)1P" + ditem[i].Material + ",3S" + ditem[i].Batch + ",Q" + QTYPerPack
							});
							printArr2.push(printArr);
							var oRequest = JSON.stringify(printArr2);
							this._JSONModel.setProperty("/printTotal", ditem.length);
							this._JSONModel.setProperty("/b64Set", []);
							this._JSONModel.setProperty("/printError", false);
							this.callZPLService(sUrl, oRequest);
							// if (oRequest==="") {
							// 	oRequest = JSON.stringify( printArr2 );
							// }else{
							// oRequest = oRequest + "," + JSON.stringify( printArr2 );
							// }
						}
						// oRequest = JSON.stringify( printArr2 );
						// this.callZPLService(sUrl, oRequest);
					}
				}
			},
			callZPLService: function (oUrl, oRequest) {
				var that = this;
				var messageText = "";
				var total = this._JSONModel.getProperty("/printTotal");
				// oUrl = "http://10.40.16.17:8010/api/Service/53C59177EA56AD3/Print";
				var aData = $.ajax({
					url: oUrl,
					type: "POST",
					crossOrigin: true,
					data: oRequest,
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",
					success: function (data, textStatus, jqXHR) {
						if (data.Successed == true) {
							//that.clearCache(); 
							var pid = data.Message;
							var localhost = "http://localhost:41958/api/Print/"+pid;
							that.localPrint(localhost);
							// that.clearCache(); 
							// var b64Set = that._JSONModel.getProperty("/b64Set");
							// if (b64Set.length + 1 == total) {
							// 	b64Set.push("true");
							// 	that.setBusy(false);
							// 	messageText = "print success"; //that._ResourceBundle.getText("infoMsg1",[sBatch]);
							// 	sap.m.MessageBox.success(messageText, {
							// 		title: "success box"
							// 	});
							// } else {
							// 	b64Set.push("true");
							// 	that._JSONModel.setProperty("/b64Set", b64Set);
							// }
						} else {

							if (!that._JSONModel.setProperty("/printError")) {
								that._JSONModel.setProperty("/printError", true);
								that.setBusy(false);
								var errMsg = data.Message;
								that.clearCache();
								messageText = "print error"; //that._ResourceBundle.getText("errMsg21",[sBatch, errMsg]);
								sap.m.MessageBox.error(messageText, {
									title: "Error" //that._ResourceBundle.getText("errorBox")
								});
							}
						}

					},
					error: function (xhr, status) {
						that.setBusy(false);
						that.clearCache();
						messageText = "print error"; //that._ResourceBundle.getText("errMsg20",[sBatch]);
						sap.m.MessageBox.error(messageText, {
							title: "Error" //that._ResourceBundle.getText("errorBox")
						});
					}
				});
			},
			localPrint: function (oUrl) {
				var that = this;
				var messageText = "";
				var total = this._JSONModel.getProperty("/printTotal");
				// oUrl = "http://10.40.16.17:8010/api/Service/53C59177EA56AD3/Print";
				var aData = $.ajax({
					url: oUrl,
					type: "GET",
					crossOrigin: true,
					Accept: "application/json",
					success: function (data, textStatus, jqXHR) {
						if (textStatus == 'success') {
							that.setBusy(false);
							var b64Set = that._JSONModel.getProperty("/b64Set");
							if (b64Set.length + 1 == total) {
								b64Set.push("true");
								that.setBusy(false);
								messageText = "print success"; //that._ResourceBundle.getText("infoMsg1",[sBatch]);
								sap.m.MessageBox.success(messageText, {
									title: "success box"
								});
							} else {
								b64Set.push("true");
								that._JSONModel.setProperty("/b64Set", b64Set);
							}
							// messageText = "print success"; //that._ResourceBundle.getText("infoMsg1",[sBatch]);
							// sap.m.MessageBox.success(messageText, {
							// 	title: "success box" //that._ResourceBundle.getText("successBox")
							// });
						} else {
							that.setBusy(false);
							that.clearCache();
							messageText = "print error"; // that._ResourceBundle.getText("errMsg20",[sBatch]);
							sap.m.MessageBox.error(messageText, {
								title: "error box" //that._ResourceBundle.getText("errorBox")
							});
						}
					},
					error: function (xhr, status) {
						that.setBusy(false);
						if (!that._JSONModel.setProperty("/printError")) {
								that._JSONModel.setProperty("/printError", true);
								that.setBusy(false);
								// var errMsg = data.Message;
								that.clearCache();
								messageText = "print error"; //that._ResourceBundle.getText("errMsg21",[sBatch, errMsg]);
								sap.m.MessageBox.error(messageText, {
									title: "Error" //that._ResourceBundle.getText("errorBox")
								});
							}
						//that.clearCache();
						// messageText = "print error"; //that._ResourceBundle.getText("errMsg20",[sBatch]);
						// sap.m.MessageBox.error(messageText, {
						// 	title: "errorbox" //that._ResourceBundle.getText("errorBox")
						// });
					}
				});
			},
			//Back
			// onBack: function () {
			// 	this._JSONModel.setProperty("/deliverySet", []);
			// 	this.onNavBack();
			// }

		});

	});