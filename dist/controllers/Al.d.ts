declare class Al {
    index: (req: any, res: any) => Promise<any>;
    scrap: (placa: string, renavam: string) => Promise<{
        placa: string;
        renavam: string;
        multas: never[];
        message: any;
    } | {
        message: string;
        placa?: undefined;
        renavam?: undefined;
        multas?: undefined;
    }>;
    convertStringToDecimal: (value: string) => number;
}
export declare const al: Al;
export {};
