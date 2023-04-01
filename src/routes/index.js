const { Router } = require('express');
const router = Router();

router.get('/:cid', (req, res) => {
    const chunks = [];
    for await (const chunk of node.cat(req.params.cid)) {
      chunks.push(chunk);
    }
    
    console.log("Retrieved file contents:", chunks.toString());
    res.json({
        content: chunks.toString()
    });
})