import { Request } from './request';
import { Response } from './response';
export declare class Tools {
    static objectIsRequest(o: Request | Response): o is Request;
}
