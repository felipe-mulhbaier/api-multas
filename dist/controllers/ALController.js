"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.al = void 0;
const validation_1 = __importDefault(require("../validations/validation"));
const puppeteer_1 = __importDefault(require("puppeteer"));
class Al {
    constructor() {
        this.index = async (req, res) => {
            const placa = req.body.placa;
            const renavam = req.body.renavam;
            const errors = validation_1.default.generic(placa, renavam);
            if (errors) {
                return res.status(400).json(errors);
            }
            const multas = await this.scrap(placa, renavam);
            res.status(200).json(multas);
        };
        this.scrap = async (placa, renavam) => {
            const browser = await puppeteer_1.default.launch({
                headless: process.env.NODE_ENV === 'production' ? 'new' : false,
                slowMo: process.env.NODE_ENV === 'production' ? 0 : 50,
                timeout: 5000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                ]
            });
            const page = await browser.newPage();
            await page.goto('https://www.detran.al.gov.br/veiculos/guia_infracoes/');
            const placaSelector = '#id_placa';
            const renavamSelector = '#id_renavam';
            const buttonsSelector = 'button[type="submit"]';
            const inputPlaca = await page.$(placaSelector);
            const inputRenavam = await page.$(renavamSelector);
            renavam = renavam.replace(/[^0-9]/g, '');
            placa = placa.replace(/[^a-zA-Z0-9]/g, '');
            await (inputPlaca === null || inputPlaca === void 0 ? void 0 : inputPlaca.type(placa));
            await (inputRenavam === null || inputRenavam === void 0 ? void 0 : inputRenavam.type(renavam));
            const buttons = await page.$$(buttonsSelector);
            const buttonSubmit = buttons[0];
            await (buttonSubmit === null || buttonSubmit === void 0 ? void 0 : buttonSubmit.click());
            const erros = await this.checkErros(browser, page, placa, renavam);
            if (erros) {
                return erros;
            }
            const multas = [];
            const uls = await page.$$('ul.list-group');
            for (let ul of uls) {
                const lis = await page.$$('ul.list-group > li');
                const data = {};
                for (let li of lis) {
                    const liHtml = await page.evaluate(li => li.innerHTML, li);
                    const htmlContent = liHtml.split('<br>').map((item) => item.trim());
                    const indice = this.removeAccents(htmlContent[0]) // Remover acentos
                        .replace(/(<([^>]+)>)/gi, "") // Remover tags HTML
                        .replace(/\n\t/g, "") // Remover quebras de linha e tabulações
                        .trim()
                        .toLowerCase()
                        .replace(/ /g, '_'); // Substituir espaços por underscores
                    const value = htmlContent[1];
                    data[indice] = value;
                }
                multas.push(data);
            }
            await browser.close();
            return { multas: multas, placa: placa, renavam: renavam, message: '' };
        };
        this.checkErros = async (browser, page, placa, renavam) => {
            try {
                const divErrorSelector = '.error';
                const divErrors = await page.waitForSelector(divErrorSelector, { timeout: 5000 });
                const divErrorsHtml = await page.evaluate((divErrors) => divErrors.innerHTML, divErrors);
                const errosClear = divErrorsHtml.replace(/(<([^>]+)>)/gi, "").replace(/\n\t/g, "").trim();
                await browser.close();
                return {
                    placa: placa,
                    renavam: renavam,
                    multas: [],
                    message: errosClear
                };
            }
            catch (e) {
                return false;
            }
        };
        this.convertStringToDecimal = (value) => {
            return Number(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
        };
    }
    removeAccents(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
}
exports.al = new Al();