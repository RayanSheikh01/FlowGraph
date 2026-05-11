const NodeCard = {
    name: 'NodeCard',
    props: {
        node: {
            type: Object,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    },
}

export default NodeCard;

