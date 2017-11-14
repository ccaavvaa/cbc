import { Request } from './request';
import { Response } from './response';

export class Tools {
    public static objectIsRequest(o: Request | Response): o is Request {
        return (o as any).query;
    }
}
