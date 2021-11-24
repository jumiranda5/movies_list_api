import { getFeedGraph, getPosts } from './_queries_post';
import { verifyAccessToken } from '../../helpers/token_helper';
import { postObject, titleObjectMini } from '../../helpers/response_helper';
const debug = require('debug')('app:feed');

export const feed = async (req, res, next) => {

  const accessToken = req.headers['x-access-token'];
  const page = req.params.page;

  try {

    const dec = await verifyAccessToken(accessToken);
    const userId = dec.userId;
    //const userId = "616b003821f6b937d9e4473e";

    // Get feed graph

    debug('Get graph...');
    const feedGraph = await getFeedGraph(userId, page);
    debug('...done');
    debug(feedGraph);

    // Get posts documents from graph ids

    debug('Get posts documents...');
    const posts = await getPosts(feedGraph.posts);
    debug('...done');

    // Reduce top 10 title objects from posts response

    for (let i = 0; i < posts.length; i++) {

      const postTop10 = posts[i].top_10;

      if (postTop10.length > 0) {
        for (let y = 0; y < postTop10.length; y++) {
          if (postTop10[y] !== null) postTop10[y] = titleObjectMini(postTop10[y], true);
        }
      }

    }

    // Build feed response object

    for (let i = 0; i < feedGraph.feed.length; i++) {

      let post_user_id;

      const post = posts.find(p => {
        const p_string = p._id.toString();
        post_user_id = p.userId;
        return p_string === feedGraph.feed[i].post;
      });

      if (post) {
        if (post_user_id.toString() === userId) feedGraph.feed[i].isOwnPost = true;
        const postResponseObject = postObject(post);
        feedGraph.feed[i].post = postResponseObject;
      }
      else {
        feedGraph.feed[i].post = null;
      }

    }

    return res.json({
      feed: feedGraph.feed
    });
  }
  catch (error) {
    return next(error);
  }

};
