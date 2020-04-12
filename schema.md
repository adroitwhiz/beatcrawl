# Schema

Property | Type | Value | Optional
-------- | ---- | ----- | --------
`name` | String | The name of the beat | No
`bpm` | Number | The BPM of the beat | Yes
`pageUrl` | String | A link to the page where you can buy the beat | no
`fileUrl` | String | A link to the audio file of the beat | No
`producers` | Array\<String\> | The producer(s) of the beat. Usually there's only one, but collabs can have multiple producers listed | No
`genres` | Array\<String\> | The genres that the beat belongs to | Yes
`moods` | Array\<String\> | The moods that the beat conveys | Yes
`availableForPurchase` | Boolean | Whether or not the beat can be purchased | Yes
`hasHook` | Boolean | Whether or not the beat includes a hook | Yes