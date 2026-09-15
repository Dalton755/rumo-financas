import {
    identificarPartesMaree
} from "./parsers/maree";


import {
    identificarPartesMercadoPago
} from "./parsers/mercadoPago";


import {
    identificarPartesBradesco
} from "./parsers/bradesco";

import {
    identificarPartesPagadorRecebedor
} from "./parsers/pagadorRecebedor";


import {
    identificarPartesOrigemDestino
} from "./parsers/origemDestino";

import {
    identificarPartesDePara
} from "./parsers/dePara";

const PARSERS = [

    identificarPartesDePara,

    identificarPartesOrigemDestino,

    identificarPartesPagadorRecebedor,

    identificarPartesMaree,

    identificarPartesMercadoPago,

    identificarPartesBradesco

];


export function identificarPartesEspecificas(
    texto
) {

    for (
        const parser of PARSERS
    ) {

        const resultado =
            parser(
                texto
            );


        if (resultado) {

            console.log(
                "[IMPORTADOR] Formato identificado:",
                resultado.formato,
                resultado
            );


            return resultado;

        }

    }


    return null;

}