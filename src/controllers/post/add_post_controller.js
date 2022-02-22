import {
  createPostDocument,
  updateTop10,
  createPostNode,
  createPostReaction } from './_queries_post';
import { verifyAccessToken } from '../../helpers/token_helper';
const debug = require('debug')('app:post');

export const add_post = async (req, res, next) => {

  // post type: reaction || recommendations || top_10
  // media type: tv || movie

  const postType = req.params.type;
  const mediaType = req.body.mediaType;
  const comment = req.body.comment || ""; // todo: validation
  const reaction = req.body.reaction;
  const title = req.body.title;
  const top10Req = req.body.top10;

  const top10 = [];
  for (let i = 0; i < top10Req.length; i++) {

    const _id = top10Req[i]._id;
    const genre = top10Req[i].genre;
    const overview = top10Req[i].overview;
    const poster = top10Req[i].poster;
    const release_year = top10Req[i].release_year;
    const title = top10Req[i].title;
    const tmdb_id = top10Req[i]._id;
    const type = top10Req[i].type;

    const top10Item = {
      _id,
      genre,
      overview,
      poster,
      release_year,
      title,
      tmdb_id,
      type
    };

    top10.push(top10Item);

  }


  let titleData;
  if (title) {
    titleData = {
      _id: title.tmdb_id,
      type: title.type,
      title: title.title,
      release_year: title.release_year,
      overview: title.overview,
      genre: title.genre,
      poster: title.poster
    };
  }

  // save post document on mongo db
  // if reaction => save title node and reaction relashionship on graph (type && tmdb id). Save post node on graph
  // if top10 => Create top10 document if not exists. Update if exists.

  try {

    const accessToken = req.headers['x-access-token'];
    const dec = await verifyAccessToken(accessToken);

    let postData;

    const recommendationsData = {
      userId: dec.userId,
      post_type: postType,
      comment: comment,
      media_type: mediaType
    };

    const top10Data = {
      userId: dec.userId,
      post_type: postType,
      comment: comment,
      media_type: mediaType,
      top_10: top10
    };

    const reactionData = {
      userId: dec.userId,
      post_type: postType,
      comment: comment,
      media_type: mediaType,
      title: titleData,
      reaction: reaction,
    };

    if (postType === "recommendations") postData = recommendationsData;
    else if (postType === "top_10") postData = top10Data;
    else if (postType === "reaction") postData = reactionData;

    debug(`Post data: ${JSON.stringify(postData)}`);

    const postDocument = await createPostDocument(postData);

    if (postType === 'recommendations' || postType === 'top_10') await createPostNode(postData, postDocument._id);
    if (postType === 'top_10') await updateTop10(dec.userId, top10, mediaType);
    if (postType === 'reaction') await createPostReaction(postData, postDocument._id);

    return res.json({ message: 'Success' });

  }
  catch (error){
    return next(error);
  }

};
