sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/UploadCollectionParameter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.m.UploadCollectionParameter} UploadCollectionParameter
     */
    function (Controller, UploadCollectionParameter) {
        "use strict";

        return Controller.extend("masterfiori.controller.CrearEmpleado", {
            onInit: function () {

                this._wizard = this.byId("wizardCrearEmpleado");
                this._oNavContainer = this.byId("wizardNavContainer");

                // Inicializamos el modelo.
                this._model = new sap.ui.model.json.JSONModel({});

                // Establecemos el tipo de empleado por defecto.
                this._model.setProperty("/_selectedEmpleado", "Interno");
                this._model.setProperty("/Type", "0");

                // Guardamos el modelo.
                this.getView().setModel(this._model);

            },

            // Función que se encarga de realizar el cambio de tipo de empleado.
            cambiarTipoEmpleado: function (params) {
                this._wizard.discardProgress(params.discardStep);
            },

            // Función para validar los datos del empleado.
            checkDatosStep: function () {
                var nombre = this._model.getProperty("/FirstName") || "";
                var apellidos = this._model.getProperty("/LastName") || "";
                var dniIncorrecto = this.comprobarDni(this._model.getProperty("/Dni") || "");
                var fecha = this._model.getProperty("/CreationDate") || "";

                if (nombre === "" || apellidos === "" || dniIncorrecto === true || fecha === "") {
                    // Si alguno de los datos está vacío o el DNI es incorrecto, no podemos continuar.
                    this._wizard.invalidateStep(this.byId("DatosStep"));
                } else {
                    this._wizard.validateStep(this.byId("DatosStep"));
                }

            },

            // Función para comprobar el DNI.
            comprobarDni: function (dni) {
                var number;
                var letter;
                var letterList;
                var regularExp = /^\d{8}[a-zA-Z]$/;

                //Se comprueba que el formato es válido
                if (regularExp.test(dni) === true) {
                    //Número
                    number = dni.substr(0, dni.length - 1);
                    //Letra
                    letter = dni.substr(dni.length - 1, 1);
                    number = number % 23;
                    letterList = "TRWAGMYFPDXBNJZSQVHLCKET";
                    letterList = letterList.substring(number, number + 1);
                    if (letterList !== letter.toUpperCase()) {
                        //Error
                        return true;
                    } else {
                        //Correcto
                        return false;
                    }
                } else {
                    //Error
                    return true;
                }
            },

            // Función para cargar el paso Datos Empleado.
            cargarPaso2: function (oEvent) {

                var dataEmployeeStep = this.byId("DatosStep");
                var typeEmployeeStep = this.byId("TipoEmpleadoStep");

                var button = oEvent.getSource();
                var typeEmployee = button.data("tipoEmpleado");

                // Se asigna el salario bruto por defecto dependiendo del tipo de empleado.
                var Salario, Type;
                switch (typeEmployee) {
                    case "interno":
                        Salario = 24000;
                        Type = "0";
                        break;
                    case "autonomo":
                        Salario = 400;
                        Type = "1";
                        break;
                    case "gerente":
                        Salario = 70000;
                        Type = "2";
                        break;
                    default:
                        break;
                }

                //Sobreescribimos el tipo y el valor del salario por defecto
                this._model.setProperty("/Type", Type);
                this._model.setProperty("/_Salary", Salario);

                //Se comprueba si se está en el paso 1, ya que se debe usar la función "nextStep" para activar el paso 2.
                if (this._wizard.getCurrentStep() === typeEmployeeStep.getId()) {
                    this._wizard.nextStep();
                } else {
                    // En caso de que ya se encuentre activo el paso 2, se navega directamente a este paso 
                    this._wizard.goToStep(dataEmployeeStep);
                }
            },

            // Función para guardar los ficheros en el modelo.
            completedHandler: function () {
                this._oNavContainer.to(this.byId("wizardReviewPage"));

                //Se obtiene los archivos subidos
                var uploadCollection = this.byId("ficherosSubidos");
                var files = uploadCollection.getItems();
                var numFiles = uploadCollection.getItems().length;
                this._model.setProperty("/_numFicheros", numFiles);
                if (numFiles > 0) {
                    var arrayFiles = [];
                    for (var i in files) {
                        arrayFiles.push({ DocName: files[i].getFileName(), MimeType: files[i].getMimeType() });
                    }
                    this._model.setProperty("/_Ficheros", arrayFiles);
                } else {
                    this._model.setProperty("/_Ficheros", []);
                }
            },

            // Función que se ejecuta al cargar un fichero en el uploadCollection
            // Se agrega el parametro de cabecera x-csrf-token con el valor del token del modelo
            // Es necesario para validarse contra sap
            onChange: function (oEvent) {

                var oUploadCollection = oEvent.getSource();

                // Header Token
                var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel("odataModel").getSecurityToken()
                });

                oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

            },

            onBeforeUploadStart: function (oEvent) {

                var oCustomerHeaderSlug = new UploadCollectionParameter({
                    name: "slug",
                    value: this.getOwnerComponent().SapId + ";" + this.newUser + ";" + oEvent.getParameter("fileName")
                });

                oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

            },

            // Función para subir los ficheros.
            onStartUpload: function () {
                var that = this;
                var oUploadCollection = that.byId("ficherosSubidos");
                oUploadCollection.upload();
            },

            // Función para navegar atrás hacía el paso Tipo.
            backToTipo: function () {
                this._navBackToStep(this.byId("TipoEmpleadoStep"));
            },

            // Función para navegar atrás hacía el paso Datos.
            backToDatos: function () {
                this._navBackToStep(this.byId("DatosStep"));
            },

            // Función para navegar atrás hacía el paso Información Adicional.
            backToInfo: function () {
                this._navBackToStep(this.byId("InformacionAdicionalStep"));
            },

            // Función para navegar atrás.
            _navBackToStep: function (step) {
                var fnAfterNavigate = function () {
                    this._wizard.goToStep(step);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);

                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this._oNavContainer.to(this._oWizardContentPage);
                this._oNavContainer.back();
            },

            //Función para guardar el nuevo empleado
            guardarEmpleado: function () {

                var json = this.getView().getModel().getData();
                var body = {};

                //Se obtienen aquellos campos que no empicen por "_", ya que son los que vamos a enviar
                for (var i in json) {
                    if (i.indexOf("_") !== 0) {
                        body[i] = json[i];
                    }
                }

                body.SapId = this.getOwnerComponent().SapId;
                body.UserToSalary = [{
                    Amount: parseFloat(json._Salary).toString(),
                    Comments: json.Comments,
                    Waers: "EUR"
                }];

                this.getView().setBusy(true);
                this.getView().getModel("odataModel").create("/Users", body, {
                    success: function (data) {
                        this.getView().setBusy(false);

                        //Se almacena el nuevo usuario
                        this.newUser = data.EmployeeId;

                        sap.m.MessageBox.information(this.oView.getModel("i18n").getResourceBundle().getText("empleadoNuevo") + ": " + this.newUser, {
                            onClose: function () {
                                // Se deshacen los cambios.
                                this.deshacerCambios();
                            }.bind(this)
                        });

                        //Se llama a la función "upload" del uploadCollection
                        this.onStartUpload();

                    }.bind(this),
                    error: function () {
                        this.getView().setBusy(false);
                    }.bind(this)
                });
            },

            //Función al cancelar la creación
            cancelar: function () {

                // Mensaje de confirmación.
                sap.m.MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("confirmarCancelar"), {

                    // En caso de aceptar....
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            this.deshacerCambios(); //Deshacer cambios
                        }
                    }.bind(this)
                });

            },

            deshacerCambios: function () {

                // Navegamos al Wizard
                this._wizard.discardProgress(this._wizard.getSteps()[0]);
                var navContainer = this.byId("wizardNavContainer");
                navContainer.to(navContainer.getPages()[0].getId());

                // Eliminamos ficheros
                var uploadCollection = this.byId("ficherosSubidos");
                uploadCollection.removeAllItems();

                //Reinicializamos
                this.onInit();

                // Navegamos al menú
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);

            }

        });
    });
