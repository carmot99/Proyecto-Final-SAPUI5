sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("masterfiori.controller.Main", {
            onInit: function () {

                // No funciona, se opta por hacer un window.open() para FirmarPedido

                // // Error en el framework : Al agregar la dirección URL de "Firmar pedidos", el componente GenericTile debería navegar directamente a dicha URL,
                // // pero no funciona en la version 1.78. Por tanto, una solución  encontrada es eliminando la propiedad id del componente por jquery
                // var genericTileFirmarPedido = this.byId("firmarPedido");
                // //Id del dom
                // var idGenericTileFirmarPedido = genericTileFirmarPedido.getId();
                // //Se vacia el id
                // jQuery("#" + idGenericTileFirmarPedido)[0].id = "";
            },

            navigateToCrearEmpleado: function (oEvent) {
                const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("CrearEmpleado");
            },

            navigateToVerEmpleado: function (oEvent) {
                const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("VerEmpleado");
            },

            navigateToFirmarPedido: function (oEvent) {
                const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                window.open("https://c69ea9a0trial-dev-logali-approuter.cfapps.us10.hana.ondemand.com/logaligroupEmployees/index.html");
            }
        });
    });
