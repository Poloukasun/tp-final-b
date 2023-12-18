import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
import { nowInSeconds } from '../utilities.js';
//import PhotoLikeModel from '../models/photoLike.js';
import Controller from './Controller.js';

export default
    class Photos extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoModel()), Authorizations.user());
    }
    post(data) {
        data["Date"] = nowInSeconds();
        super.post(data);
    }
    put(data) {
        data["Date"] = nowInSeconds();
        super.put(data);
    }
}