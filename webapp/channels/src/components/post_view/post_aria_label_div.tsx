// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {Post} from '@mattermost/types/posts';

import {usePostAriaLabel} from 'utils/post_utils';

export type Props = React.HTMLProps<HTMLDivElement> & {
    post: Post;
    autotranslated: boolean;
};

const PostAriaLabelDiv = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const {
        children,
        post,
        autotranslated,
        ...otherProps
    } = props;

    const ariaLabel = usePostAriaLabel(post, autotranslated);

    // A post is an article named by its label (who wrote it, when, and what), so it's read as one piece of
    // content; a label on a plain div isn't used. A caller can pass another role.
    return (
        <div
            ref={ref}
            role='article'
            aria-label={ariaLabel}
            {...otherProps}
        >
            {children}
        </div>
    );
});

PostAriaLabelDiv.displayName = 'PostAriaLabelDiv';

export default PostAriaLabelDiv;
