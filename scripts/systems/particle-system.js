TowerDefense.systems.ParticleSystem = function() {
    let system = System();

    /*
    * 1. entities have multiple emitters stored somehow.
    * 2. pass correct emitter to system.emit
    * 3. create particles
    * 4. each particle is turned into a renderable entity via report. also added to system.entities
      5. update updates system.entities which are particles.
      6. dead particles are reported */

    let toCreate = [];
    system.emit = function(emitter) {
        for (let i = 0; i < emitter.quantity; ++i) {
            toCreate.push(createParticle(emitter));
        }
    };


    system.update = function(elapsedTime, entities, report) {
        for (let i = 0; i < toCreate.length; ++i) {
            report(toCreate[i]);
        }
        toCreate.length = 0;

        for (let id in system.entities) {
            let particle = system.entities[id];
            let partComp = particle.components.particle;
            let pos = particle.components.position;

            partComp.aliveDuration += elapsedTime;


            pos.x += (elapsedTime / 1000 * partComp.speed * partComp.direction.x);
            pos.y += (elapsedTime / 1000 * partComp.speed * partComp.direction.y);

            pos.rotation += partComp.speed * partComp.rotationToSpeed;
            pos.rotation %= 360;

            if (partComp.aliveDuration >= partComp.lifetime) {
                report(particle);
            }
        }
    };

    function createParticle(emitter) {
        let particle = {};
        let size = Random.nextGaussian(emitter.size.mean, emitter.size.stddev);

        particle.center = {
                x: emitter.center.x,
                y: emitter.center.y,
            };

        particle.size = {
                width: size,
                height: size
            };

        particle.direction = Random.nextCircleVector();
        particle.speed =Random.nextGaussian(emitter.speed.mean, emitter.speed.stddev);
        particle.rotation = 0;
        particle.rotationToSpeed = emitter.rotationToSpeed;
        particle.lifetime = Random.nextGaussian(emitter.lifetime.mean, emitter.lifetime.stddev);
        particle.aliveDuration = 0;
        if (particle.size <= 0) {
            particle.size = emitter.size.mean;
        }

        if (particle.lifetime <= 0) {
            particle.lifetime = emitter.lifetime.mean;
        }

        if (particle.speed <= 0) {
            particle.speed = emitter.speed.mean;
        }

        particle.img = emitter.img;

        return particle;
    }

    return system;
};