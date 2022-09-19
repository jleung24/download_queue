# Download Queue Extension
An extension that manages downloads as a queue, designed for users who prefer to download one file at a time when dealing with simultaneous downloads. The queue is a Preemptive Shortest Job First style of queue, using remaining bytes left to download as the deciding factor to decide on the shortest job. The algorithm takes into account partially downloaded files, but will not take into account download speed. Even if two files have different download speeds, the algorithm will only look at remaining bytes left to download. Users will not be able to manually pause and resume downloads, but can still cancel them manually.

Note: google drive has an issue triggered by pausing downloads, so downloads from google drive will be filtered out of the queue. 
