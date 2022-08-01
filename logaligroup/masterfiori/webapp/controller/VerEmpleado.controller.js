sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator      
     */
    function (Controller, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("masterfiori.controller.VerEmpleado", {
            onInit: function () {
                this._splitAppEmployee = this.byId("splitAppEmployee");
            },

            //Función para volver al menú.
            volverMenu: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);
            },

            //Función para filtrar empleados
            onSearchEmployee: function (oEvent) {

                // Guardamos la búsqueda.
                let sQuery = oEvent.getSource().getValue();
                let aFilters = [];

                //Por defecto el filtro busca nuestros empleados.
                let filter = new Filter({
                    filters: [
                        new Filter({
                            path: 'SapId',
                            operator: 'EQ',
                            value1: this.getOwnerComponent().SapId
                        }),

                    ], and: true
                })

                //Comprobamos que la búsqueda sea válida.
                if (sQuery && sQuery.length > 0) {

                    filter = new Filter({
                        filters: [

                            //Filtro ID (para que solo salgan los empleado que yo he creado).
                            new Filter({
                                path: 'SapId',
                                operator: 'EQ',
                                value1: this.getOwnerComponent().SapId
                            }),

                            //Filtro Nombre.
                            new Filter({
                                path: 'FirstName',
                                operator: FilterOperator.Contains,
                                value1: sQuery
                            })
                            
                        ], and: true

                    })

                }

                //Lanzamos filtro.
                aFilters.push(filter);

                let oList = this.byId("listadoEmpleados");
                let oBinding = oList.getBinding("items");

                // Actualizamos el listado con el filtro.
                oBinding.filter(aFilters, "Application");

            },

            //Función al seleccionar un empleado
            seleccionarEmpleado: function (oEvent) {

                //Se navega al detalle del empleado
                this._splitAppEmployee.to(this.createId("detalleEmpleado"));
                var context = oEvent.getParameter("listItem").getBindingContext("odataModel");

                //Se almacena el usuario seleccionado
                this.employeeId = context.getProperty("EmployeeId");
                var detalleEmpleado = this.byId("detalleEmpleado");

                //Se bindea a la vista
                detalleEmpleado.bindElement("odataModel>/Users(EmployeeId='" + this.employeeId + "',SapId='" + this.getOwnerComponent().SapId + "')");

            },

            //Función para descargar ficheros adjuntos
            descargar: function (oEvent) {
                var sPath = oEvent.getSource().getBindingContext("odataModel").getPath();
                window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value");
            },

            //Función que se ejecuta al cargar un fichero en el uploadCollection
            //Se agrega el parametro de cabecera x-csrf-token con el valor del token del modelo
            //Es necesario para validarse contra sap
            onChange: function (oEvent) {
                var oUploadCollection = oEvent.getSource();
                // Header Token
                var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel("odataModel").getSecurityToken()
                });
                oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
            },

            //Función que se ejecuta por cada fichero que se va a subir a sap
            //Se debe agregar el parametro de cabecera "slug" con el valor "id de sap del alumno",id del nuevo usuario y nombre del fichero, separados por ;
            onBeforeUploadStart: function (oEvent) {
                var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: this.getOwnerComponent().SapId + ";" + this.employeeId + ";" + oEvent.getParameter("fileName")
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
            },

            //Función para refrescar la lista de adjuntos
            onUploadComplete: function (oEvent) {
                var oUploadCollection = oEvent.getSource();
                oUploadCollection.getBinding("items").refresh();
            },

            //Función para ejecutarse al borrar fichero.
            onFileDeleted: function (oEvent) {

                var oUploadCollection = oEvent.getSource();
                var sPath = oEvent.getParameter("item").getBindingContext("odataModel").getPath();

                this.getView().getModel("odataModel").remove(sPath, {

                    //Completado
                    success: function () {
                        //Refrescar listado de ficheros.
                        oUploadCollection.getBinding("items").refresh();
                    },

                    //Error
                    error: function () {

                    }
                });

            },

            //Función para eliminar el empleado seleccionado
            eliminarEmpleado: function () {

                //Se muestra un mensaje de confirmación
                sap.m.MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("confirmarEliminar"), {
                    title: this.getView().getModel("i18n").getResourceBundle().getText("confirmar"),
                    onClose: function (oAction) {
                        if (oAction === "OK") {

                            //Se llama a la función remove
                            this.getView().getModel("odataModel").remove("/Users(EmployeeId='" + this.employeeId + "',SapId='" + this.getOwnerComponent().SapId + "')", {
                                success: function (data) {
                                    sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("confirmarEliminado"));
                                    
                                    //En el detalle se muestra el mensaje "Seleccione empleado"
                                    this._splitAppEmployee.to(this.createId("detailSelectEmployee"));
                                }.bind(this),
                                error: function (e) {
                                    sap.base.Log.info(e);
                                }.bind(this)
                            });
                        }
                    }.bind(this)
                });
            },

            //Función para ascender a un empleado
            abrirAscenso: function () {

                //Comprobamos que la ventana de ascenso esté inactiva
                if (!this.ventanaAscender) {

                    this.ventanaAscender = sap.ui.xmlfragment("masterfiori/fragment/AscenderEmpleado", this);
                    //Abrimos la ventana
                    this.getView().addDependent(this.ventanaAscender);

                }

                this.ventanaAscender.setModel(new sap.ui.model.json.JSONModel({}), "ascensoEmpleado");
                this.ventanaAscender.open();
            },

            //Función para crear un nuevo ascenso
            crearAscenso: function () {

                //Se obtiene el modelo ascensoEmpleado que rellenamos en el View.
                var nuevoAscenso = this.ventanaAscender.getModel("ascensoEmpleado");

                //Se guardan los datos.
                var oData = nuevoAscenso.getData();

                //Se prepara la informacion.
                var body = {
                    Amount: oData.Amount,
                    CreationDate: oData.CreationDate,
                    Comments: oData.Comments,
                    SapId: this.getOwnerComponent().SapId,
                    EmployeeId: this.employeeId
                };

                this.getView().setBusy(true);
                this.getView().getModel("odataModel").create("/Salaries", body, {

                    // Operación correcta.
                    success: function () {

                        this.getView().setBusy(false);
                        //Mensaje de ascenso correcto.
                        sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ascensoCorrecto"));
                        this.cerrarVentana();

                    }.bind(this),

                    // Error.
                    error: function () {
                        this.getView().setBusy(false);

                        //Mensaje de ascenso erróneo.
                        sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ascensoError"));

                    }.bind(this)

                });

            },

            //Función para cerrar la ventana de Ascender
            cerrarVentana: function () {
                this.ventanaAscender.close();
            }
        });

    });